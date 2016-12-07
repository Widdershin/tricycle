import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div} from '@cycle/dom';
import xs from 'xstream';

import Scratchpad from './src/scratchpad';

const startingCode = `
import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div, button} from '@cycle/dom';
import _ from 'lodash';
import xs from 'xstream';

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

const sources = {
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
