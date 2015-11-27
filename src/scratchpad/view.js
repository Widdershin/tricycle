import {div, input, textarea, span} from '@cycle/dom';

export default function scratchpadView ([props, error]) {
  return (
    div('.scratchpad', [
      div('.vim-support', [
        div('vim mode'),
        input('.vim-checkbox', {type: 'checkbox'})
      ]),

      div('.code', {id: 'editor', value: props.code}),

      div('.result-container', [
        div('.result'),
        div('.error', error.toString())
      ])
    ])
  );
}
