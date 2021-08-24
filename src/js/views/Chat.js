import { html } from 'htm/preact';
import View from './View.js';
import ChatList from '../components/ChatList.js';
import ChatMain from '../components/ChatMain';

class Chat extends View {
  constructor() {
    super();
    this.id = "chat-view";
  }

  renderView() {
    return html`
      <${ChatList} class=${this.props.id || this.props.hashtag ? 'hidden-xs' : ''}/>
      <${ChatMain} hashtag=${this.props.hashtag} id=${this.props.id} key=${this.props.id || this.props.hashtag} />
    `;
  }
}

export default Chat;
