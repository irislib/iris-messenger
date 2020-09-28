import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import Message from './Message.js';
import PublicMessages from '../PublicMessages.js';
import {localState} from '../Main.js';
import Session from '../Session.js';
import {chats} from '../Chat.js';
import { route } from '../lib/preact-router.es.js';
import {translate as t} from '../Translation.js';


class MessageView extends Component {
  constructor() {
    super();
    this.eventListeners = [];
  }

  componentDidMount() {
    if (this.props.hash) {
      localState.get('msgFrom').put(null);
      PublicMessages.getMessageByHash(this.props.hash).then(msg => {
        const v = msg.signedData;
        v.info = {hash: this.props.hash};
        this.setState({msg: v});
        if (v.author && v.author.keyID) {
          localState.get('msgFrom').put(v.author.keyID);
        }
      });
    }
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  deleteMsg() {
    console.log(this.state.msg);
    chats['public'].delete(this.state.msg.time);
    chats['public'].sortedMessages = chats['public'].sortedMessages.filter(m => m.time === this.state.msg.time);
    route('/');
  }

  render() {
    const k = Session.getKey() || {};
    const author = this.state.msg && this.state.msg.author && this.state.msg.author.keyID;
    const actions = author && author === k.pub ? html`<button onClick=${() => this.setState({deleting:true})}>${t('delete')}</button>` : '';
    return this.state.msg ? html`
      <div class="main-view public-messages-view" id="message-view">
        <div id="message-list" class="centered-container">
          <${Message} ...${this.state.msg} showName=${true} chatId=${this.state.msg.info.from}/>
        </div>
        ${this.state.deleting ? html`
          <p>${t('confirm_delete_msg')}</p>
          <p>
            <button onClick=${() => this.setState({deleting:false})}>${t('cancel')}</button>
            <button onClick=${() => this.deleteMsg()}>${t('delete')}</button>
          </p>
          `: actions}
        <div id="attachment-preview" style="display:none"></div>
      </div>
    ` : '';
  }
}

export default MessageView;
