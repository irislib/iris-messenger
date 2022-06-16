import { Component } from 'preact';
import State from '../State.js';
import Session from '../Session.js';
import iris from '../iris-lib';

function twice(f) {
  f();
  setTimeout(f, 100); // write many times and maybe it goes through :D
}

const mentionRegex = /\B\@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

export default class MessageForm extends Component {
  async sendPublic(msg) {
    msg.time = new Date().toISOString();
    msg.type = 'post';
    const signedMsg = await iris.SignedMessage.create(msg, Session.getKey());
    const serialized = signedMsg.toString();
    const hash = await iris.util.getHash(serialized);
    State.public.get('#').get(hash).put(serialized);
    if (msg.replyingTo) {
      twice(() => State.public.user().get('replies').put({}));
      twice(() => State.public.user().get('replies').get(msg.replyingTo).put('a'));
      twice(() => State.public.user().get('replies').get(msg.replyingTo).put({}));
      twice(() => State.public.user().get('replies').get(msg.replyingTo).get(msg.time).put(hash));
    } else {
      let node = State.public.user();
      (this.props.index || (this.props.hashtag && `hashtags/${this.props.hashtag}`) || 'msgs').split('/').forEach(s => {
        node.put({});
        node = node.get(s);
      });
      twice(() => node.get(msg.time).put(hash));
    }
    const hashtags = msg.text && msg.text.match(/\B\#\w\w+\b/g);
    if (hashtags) {
      hashtags.forEach(match => {
        const hashtag = match.replace('#', '');
        State.public.user().get('hashtags').get(hashtag).put({a:null});
        State.public.user().get('hashtags').get(hashtag).get(msg.time).put(hash)
      });
    }
    msg.torrentId && State.public.user().get('media').get(msg.time).put(hash);
    this.props.onSubmit && this.props.onSubmit(msg);
    return hash;
  }

  onMsgTextPaste(event) {
    const pasted = (event.clipboardData || window.clipboardData).getData('text');
    const magnetRegex = /^magnet:\?xt=urn:btih:*/;
    if (pasted !== this.state.torrentId && pasted.indexOf('.torrent') > -1 || pasted.match(magnetRegex)) {
      event.preventDefault();
      this.setState({torrentId: pasted});
    }
  }

  checkMention(event) {
    const val = event.target.value.slice(0, event.target.selectionStart);
    const matches = val.match(mentionRegex);
    if (matches) {
      this.setState({mentioning: matches[0].slice(1)});
    } else if (this.state.mentioning) {
      this.setState({mentioning: null});
    }
  }
}
