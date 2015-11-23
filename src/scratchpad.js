import {run} from '@cycle/core';
import {Observable, Subject} from 'rx';
import {makeDOMDriver, div} from '@cycle/dom';

import view from './scratchpad/view';

import vm from 'vm';

export default function Scratchpad (DOM, props) {
  let sources, sinks;

  const code$ = DOM.select('.code').events('input')
    .debounce(300)
    .map(ev => ev.target.value)
    .map(code => ({code}));

  const error$ = new Subject();

  error$.forEach(console.log.bind(console))

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
}     `;

    try {
      vm.runInNewContext(wrappedCode, context);
    } catch (e) {
      error$.onNext(e);
    }

    console.log(code);

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
