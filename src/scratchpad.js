import {run} from '@cycle/core';
import {Observable} from 'rx';
import {makeDOMDriver, div} from '@cycle/dom';

import view from './scratchpad/view';

import vm from 'vm';

export default function Scratchpad (DOM, props) {
  let sources, sinks;
  const code$ = DOM.select('.code').events('input')
    .debounce(300)
    .map(ev => ev.target.value)
    .map(code => ({code}));

  props.delay(100).merge(code$).forEach(({code}) => {
    if (sources) {
      sources.dispose();
    }

    if (sinks) {
      sinks.dispose();
    }

    const context = {div, Observable};

    try {
      vm.runInNewContext(code, context);
    } catch (e) {
      console.trace(e);
    }

    console.log(code);

    if (typeof context.main !== 'function') {
      return;
    }

    const userDrivers = {
      DOM: makeDOMDriver('.result')
    }

    const userApp = run(context.main, userDrivers);

    sources = userApp.sources;
    sinks = userApp.sinks;
  });

  return {
    DOM: props.map(view)
  };
}
