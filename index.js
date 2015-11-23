import {run} from '@cycle/core';
import {makeDOMDriver, div} from '@cycle/dom';
import {Observable} from 'rx';

import Scratchpad from './src/scratchpad';

const startingCode = `
import {run} from '@cycle/core';
import {makeDOMDriver, div} from '@cycle/dom';
import {Observable} from 'rx';

function main ({DOM}) {
  return {
    DOM: div('.hello-world', 'Hello world!')
  };
}

run(main, {
  DOM: makeDOMDriver('.app')
});
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
