import {run} from '@cycle/core';
import {makeDOMDriver, h, div} from '@cycle/dom';
import {Observable, Subject} from 'rx';
import {restart, restartable} from 'cycle-restart';

const babel = require('babel-core');
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/keybinding/vim';

import _ from 'lodash';

import view from './scratchpad/view';

import es2015 from 'babel-preset-es2015';

import vm from 'vm';

import https from 'https';

function transformES6 (error$) {
  return ({code}) => {
    try {
      return babel.transform(code, {presets: [es2015]});
    } catch (e) {
      error$.onNext(e);
      return {code: ''};
    }
  };
}

function startAceEditor (code$) {
  function updateCode (editor) {
    return (_, ev) => {
      code$.onNext({code: editor.getSession().getValue()});
    };
  }

  return ({code}) => {
    window.editor = ace.edit('editor');
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/monokai');
    editor.getSession().setOptions({
      tabSize: 2
    });

    editor.setValue(code);
    editor.clearSelection();
    editor.on('input', updateCode(editor));
  };
}

export default function Scratchpad (DOM, props) {
  let sources, sinks, drivers;

  const code$ = new Subject();

  const error$ = new Subject();

  error$.forEach(console.log.bind(console));

  props.delay(100).subscribe(startAceEditor(code$));

  DOM.select('.vim-checkbox').events('change')
    .map(ev => ev.target.checked ? 'ace/keyboard/vim' : null)
    .startWith(null)
    .forEach(keyHandler => {
      if (window.editor) {
        window.editor.setKeyboardHandler(keyHandler);
      }
    });

  const restartEnabled$ = DOM.select('.instant-checkbox').events('change')
    .map(ev => ev.target.checked)
    .startWith(true);

  props.merge(code$)
    .debounce(300)
    .map(transformES6(error$))
    .withLatestFrom(restartEnabled$, (props, restartEnabled) => [props, restartEnabled])
    .forEach(([{code}, restartEnabled]) => runOrRestart(code, restartEnabled))

  function runOrRestart(code, restartEnabled) {
    if (sources) {
      sources.dispose();
    }

    if (sinks) {
      sinks.dispose();
    }

    // Store npm modules that have been loaded from http://wrzd.in.
    let moduleCache = {};

    // Matches for all npm modules that will need to be loaded.
    const requireMatches = code.match(/require\(.*/g);

    function runInVm (code) {
      const context = {
        error$: error$,
        console: console,
        require: (path) => {
          return moduleCache[path];
        }
      };

      const wrappedCode = `
        try {
          ${code}

          error$.onNext('');
        } catch (e) {
          error$.onNext(e);
        }
      `;

      try {
        vm.runInNewContext(wrappedCode, context);
      } catch (e) {
        error$.onNext(e);
      }

      if (typeof context.main !== 'function' || typeof context.sources !== 'object') {
        return;
      }

      let userApp;

      if (!drivers) {
        drivers = context.sources;
      }

      try {
        if (sources && restartEnabled) {
          userApp = restart(context.main, drivers, {sources, sinks})
        } else {
          userApp = run(context.main, context.sources);
        }
      } catch (e) {
        error$.onNext(e);
      }

      if (userApp) {
        sources = userApp.sources;
        sinks = userApp.sinks;
      }
    }

    function fetchModules (moduleList) {
      return new Promise((resolve, reject) => {
        let dependencies = moduleList.reduce((acc, moduleName) => {
          const moduleNameWithScope = moduleName.replace('/', '%2F');
          acc[moduleNameWithScope] = 'latest';

          return acc;
        }, {});

        let postData = {
          'options': {
            'debug': false,
            'standalone': true
          },
          'dependencies': dependencies
        };

        const options = {
          hostname: 'wzrd.in',
          path: '/multi',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let content = '';

          res.setEncoding('utf8');

          res.on('data', (chunk) => {
            content += chunk;
          });

          res.on('end', () => {
            resolve(JSON.parse(content));
          });
        });

        req.on('error', (e) => {
          reject(e);
        });

        req.write(JSON.stringify(postData));
        req.end();
      });
    };

    // There are npm modules to import.
    if (requireMatches) {

      // Get list of required modules.
      const requireList = requireMatches.reduce((acc, value) => {
        const moduleName = value.split(/[']|["]/)[1];
        acc.push(moduleName);

        return acc;
      }, []);

      // Get an array of all the modules source code.
      const moduleSourceList$ = Observable.of(requireList)
        .map((requireList) => {
          return fetchModules(requireList);
        })
        .flatMap((moduleSourceList) => {
          return moduleSourceList;
        });

      // Take an array of module sources and run each in a separate vm.
      // Return a stream of each module.
      const exportsList$ = moduleSourceList$
        .map((moduleSourceList) => {
          return Observable.create((observer) => {
            Object.keys(moduleSourceList).forEach((element) => {
              let modulePackage = moduleSourceList[element]['package'];
              let moduleBundle = moduleSourceList[element]['bundle']

              const context = {
                exports: {},
                module: {
                  exports: {}
                }
              };

              vm.runInNewContext(moduleBundle, context);

              observer.onNext({
                name: modulePackage['name'],
                module: context.module.exports
              });
            });

            observer.onCompleted();
          });
        });

      const moduleObj$ = exportsList$
        .flatMap((moduleObj) => {
          return moduleObj;
        });

      // Add each module to the cache and run the code when completed.
      moduleObj$.subscribe(
        (moduleObj) => {
          const newObj = {};
          newObj[moduleObj.name] = moduleObj.module;
          moduleCache = Object.assign({}, moduleCache, newObj);
        },
        (e) => error$.onNext(e),
        () => runInVm(code)
      );
    } else {
      runInVm(code);
    }
  };

  const clientWidth$ = DOM.select(':root').observable.pluck('clientWidth');
  const mouseDown$ = DOM.select('.handler').events('mousedown');
  const mouseUp$ = DOM.select('.tricycle').events('mouseup');
  const mouseMove$ = DOM.select('.tricycle').events('mousemove');
  const mouseLeave$ = DOM.select('.tricycle').events('mouseleave');

  const MAX_RESULT_WIDTH = 0.9;
  const MIN_RESULT_WIDTH = 0.1;

  const windowSize$ = mouseDown$
    .flatMap(mouseDown => mouseMove$.takeUntil(mouseUp$.merge(mouseLeave$)))
    .combineLatest(clientWidth$.throttle(100), (mouseDrag, clientWidth) =>
      (clientWidth - mouseDrag.clientX) / clientWidth
    )
    .filter(fraction =>
      fraction < MAX_RESULT_WIDTH && fraction > MIN_RESULT_WIDTH
    )
    .map(fraction => ({
      codeWidth: `${100*(1 - fraction)}%`,
      resultWidth: `${100*fraction}%`
    }));

  return {
    DOM: props.merge(windowSize$).combineLatest(error$.startWith('')).map(view)
  };
}
