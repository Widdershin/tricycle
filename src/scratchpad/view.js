import {div, textarea} from '@cycle/dom';

export default function scratchpadView ([props, error]) {
  return (
    div('.scratchpad', [
      div('.code', {id: 'editor', value: props.code}),

      div('.result-container', [
        div('.result'),
        div('.error', error.toString())
      ])
    ])
  );
}
