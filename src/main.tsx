import "preact/debug";

import { render } from 'preact';

import Main from './js/Main';

import './index.css';

render(<Main />, document.getElementById('app') as HTMLElement);
