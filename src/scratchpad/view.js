import {div, input, textarea, span} from '@cycle/dom';

export default function scratchpadView ([props, error]) {
  return (
    div('.scratchpad', [
      div('.vim-support', [
        div('vim mode'),
        input('.vim-checkbox', {type: 'checkbox'}),
        div('enable cycle-restart'),
        input('.instant-checkbox', {type: 'checkbox', checked: true})
      ]),

      div('.code', {id: 'editor', value: props.code}),

      div('.result-container', [
        div('.app'),
        div('.error', error.toString())
      ])
    ])
  );
}
