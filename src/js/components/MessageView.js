import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import Message from './Message.js';
import PublicMessages from '../PublicMessages.js';

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

  render() {
    return this.state.msg ? html`
      <div class="main-view public-messages-view" id="message-view">
        <div id="message-list">
          <${Message} ...${this.state.msg} showName=${true} chatId=${this.state.msg.info.from}/>
        </div>
        <div id="attachment-preview" style="display:none"></div>
      </div>
    ` : '';
  }
}

export default MessageView;
