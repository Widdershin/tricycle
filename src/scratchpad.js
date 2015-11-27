import {run} from '@cycle/core';
import {makeDOMDriver, h, div} from '@cycle/dom';
import {Observable, Subject} from 'rx';
const babel = require('babel-core');
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/keybinding/vim';

import _ from 'lodash';

import view from './scratchpad/view';

import es2015 from 'babel-preset-es2015';

import vm from 'vm';

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
  let sources, sinks;

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

  props.merge(code$).debounce(100).map(transformES6(error$)).forEach(({code}) => {
    if (sources) {
      sources.dispose();
    }

    if (sinks) {
      sinks.dispose();
    }

    const context = {error$, require};

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

    console.log('running cycle app with', code);

    if (typeof context.main !== 'function') {
      return;
    }

    const userDrivers = {
      DOM: makeDOMDriver('.result')
    };

    let userApp;

    try {
      userApp = run(context.main, userDrivers);
    } catch (e) {
      error$.onNext(e);
    }

    if (userApp) {
      sources = userApp.sources;
      sinks = userApp.sinks;
    }
  });

  return {
    DOM: props.combineLatest(error$.startWith('')).map(view)
  };
}
