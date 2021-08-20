import { html } from 'htm/preact';
import View from './View.js';
import ChatList from '../components/ChatList.js';
import {Helmet} from 'react-helmet';
import ChatMain from '../components/ChatMain';

class Chat extends View {
  constructor() {
    super();
    this.id = "chat-view";
  }

  renderView() {
    return html`
      <${ChatList} class=${this.props.id ? 'hidden-xs' : ''}/>
      <${ChatMain} id=${this.props.id} key=${this.props.id} />
    `;
  }
}

export default Chat;
