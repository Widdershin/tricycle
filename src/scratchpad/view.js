import {div, input, textarea, span} from '@cycle/dom';

export default function scratchpadView ([props, error]) {
  return (
    div('.scratchpad', [
      div('.vim-support', [
        div('vim mode'),
        input('.vim-checkbox', {props: {type: 'checkbox'}}),
        // div('enable cycle-restart'),
        // input('.instant-checkbox', {props: {type: 'checkbox', checked: true}})
      ]),

      div('#editor.code', {props: {
        value: props.code,
        style: {width: props.codeWidth}
      }}),
      div('.handler'),
      div('.result-container', {style: {width: props.resultWidth}}, [
        div('.app'),
        div('.error', error.toString())
      ])
    ])
  );
}
