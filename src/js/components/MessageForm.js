import { Component } from 'preact';
import iris from 'iris-lib';
import Session from 'iris-lib/src/session';
import SignedMessage from 'iris-lib/src/SignedMessage';
import util from 'iris-lib/src/util';

function twice(f) {
  f();
  setTimeout(f, 100); // write many times and maybe it goes through :D
}

const mentionRegex = /\B\@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

export default class MessageForm extends Component {
  async sendPublic(msg) {
    msg.time = new Date().toISOString();
    msg.type = 'post';
    const signedMsg = await SignedMessage.create(msg, Session.getKey());
    const serialized = signedMsg.toString();
    const hash = await iris.static.put(serialized);
    if (msg.replyingTo) {
      twice(() => iris.user().get('replies').put({}));
      twice(() => iris.user().get('replies').get(msg.replyingTo).put('a'));
      twice(() => iris.user().get('replies').get(msg.replyingTo).put({}));
      twice(() => iris.user().get('replies').get(msg.replyingTo).get(msg.time).put(hash));
    } else {
      let node = iris.user();
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
        iris.user().get('hashtags').get(hashtag).put({a:null});
        iris.user().get('hashtags').get(hashtag).get(msg.time).put(hash)
      });
    }
    msg.torrentId && iris.user().get('media').get(msg.time).put(hash);
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
