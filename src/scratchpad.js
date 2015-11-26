import {run} from '@cycle/core';
import {Observable, Subject} from 'rx';
import {makeDOMDriver, div} from '@cycle/dom';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';

import view from './scratchpad/view';

import vm from 'vm';

function startAceEditor (code$) {
  function updateCode (editor) {
    return (_, ev) => {
      code$.onNext({code: editor.getSession().getValue()});
    };
  }

  return ({code}) => {
    var editor = ace.edit('editor');
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

  props.delay(100).merge(code$).forEach(({code}) => {
    if (sources) {
      sources.dispose();
    }

    if (sinks) {
      sinks.dispose();
    }

    const context = {div, Observable, error$};

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

    const userApp = run(context.main, userDrivers);

    sources = userApp.sources;
    sinks = userApp.sinks;
  });

  return {
    DOM: props.combineLatest(error$.startWith('')).map(view)
  };
}
