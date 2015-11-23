import {run} from '@cycle/core';
import {makeDOMDriver, div} from '@cycle/dom';
import {Observable} from 'rx';

import Scratchpad from './src/scratchpad';

const startingCode = `
function main () {
  return {
    DOM: Observable.just(div('.hello-world', 'Hello world!'))
  };
}
`;

function main ({DOM}) {
  const props = Observable.just({code: startingCode});
  const scratchpad = Scratchpad(DOM, props);

  return {
    DOM: scratchpad.DOM
  };
}

run(main, {
  DOM: makeDOMDriver('.app')
});
