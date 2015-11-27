import {run} from '@cycle/core';
import {makeDOMDriver, div} from '@cycle/dom';
import {Observable} from 'rx';

import Scratchpad from './src/scratchpad';

const startingCode = `
const Cycle = require('@cycle/core');
const {makeDOMDriver, div} = require('@cycle/dom');
const _ = require('lodash');
const {Observable} = require('rx');


function main ({DOM}) {
  return {
    DOM: Observable.just(div('.hello-world', 'Hello world!'))
  };
}

const drivers = {
  DOM: makeDOMDriver('.app')
}

// Normally you need to call Cycle.run, but Tricycle handles that for you!
// If you want to try this out locally, just uncomment this code.
//
// Cycle.run(main, drivers);
`;

function main ({DOM}) {
  const props = Observable.just({code: startingCode});
  const scratchpad = Scratchpad(DOM, props);

  return {
    DOM: scratchpad.DOM
  };
}

run(main, {
  DOM: makeDOMDriver('.tricycle')
});
