import {Observable} from 'rx';

import view from './scratchpad/view';

export default function Scratchpad (DOM, props) {
  return {
    DOM: props.map(view)
  };
}
