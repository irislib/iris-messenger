import { render } from 'preact';

import Session from '@/nostr/Session';

import Main from './js/Main';

import './index.css';

Session.init({ autologin: false, autofollow: false });

render(<Main />, document.getElementById('app') as HTMLElement);
