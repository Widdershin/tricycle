import {div, textarea} from '@cycle/dom';

export default function scratchpadView ([props, error]) {
  return (
    div('.scratchpad', [
      textarea('.code', {value: props.code}),
      div('.result-container', [
        div('.result'),
        div('.error', error.toString())
      ])
    ])
  );
}
