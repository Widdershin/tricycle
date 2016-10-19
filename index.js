import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div} from '@cycle/dom';
import xs from 'xstream';
// import {restartable} from 'cycle-restart';

import Scratchpad from './src/scratchpad';

const startingCode = `
const Cycle = require('@cycle/xstream-run');
const {makeDOMDriver, div, button} = require('@cycle/dom');
const _ = require('lodash');
const xs = require('xstream');
// const {restartable} = require('cycle-restart');

function main ({DOM}) {
  const add$ = DOM
    .select('.add')
    .events('click')
    .map(ev => 1);

  const count$ = add$
    .fold((total, change) => total + change, 0)

  return {
    DOM: count$.map(count =>
      div('.counter', [
        'Count: ' + count,
        button('.add', 'Add')
      ])
    )
  };
}

// This looks a little different than normal. It's to enable support for cycle-restart,
// which automatically plays back your actions when the code reloads.
// See https://github.com/Widdershin/cycle-restart for more info
const sources = {
  // DOM: restartable(makeDOMDriver('.app'), {pauseSinksWhileReplaying: false})
  DOM: makeDOMDriver('.app')
}

// Normally you need to call Cycle.run, but Tricycle handles that for you!
// If you want to try this out locally, just uncomment this code.
//
// Cycle.run(main, sources);
`;

function main ({DOM}) {
  const props = xs.of({code: startingCode});
  const scratchpad = Scratchpad(DOM, props);

  return {
    DOM: scratchpad.DOM
  };
}

run(main, {
  DOM: makeDOMDriver('.tricycle')
});
