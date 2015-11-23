import {run} from '@cycle/core';
import {Observable} from 'rx';
import {makeDOMDriver, div} from '@cycle/dom';

import view from './scratchpad/view';

import vm from 'vm';

export default function Scratchpad (DOM, props) {
  props.delay(100).forEach(({code}) => {
    const context = {div, Observable};
    const main = vm.runInNewContext(code, context);

    const userDrivers = {
      DOM: makeDOMDriver('.result')
    }

    const userApp = run(context.main, userDrivers);
  });

  return {
    DOM: props.map(view)
  };
}
