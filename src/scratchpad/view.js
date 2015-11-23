import {div, textarea} from '@cycle/dom';

export default function scratchpadView (props) {
  return (
    div('.scratchpad', [
      textarea('.code', {value: props.code}),
      div('.result')
    ])
  );
}
