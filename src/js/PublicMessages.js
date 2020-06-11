import {addChat, showChat} from './Chats.js';

let pub;
let callback;

function sendPublicMsg(msg) {
  msg.time = msg.time || new Date();
  pub.messages[msg.time] = msg;
  callback && callback(msg, {selfAuthored: true});
}

function getMessages(cb) {
  callback = cb;
}

function init() {
  const u = () => {};
  pub = {
    name: 'Public messages',
    messages: {},
    getId: () => 'public',
    send: sendPublicMsg,
    getMessages,
    onTheir: u,
    onMy: u,
    getTheirMsgsLastSeenTime: u,
    getMyMsgsLastSeenTime: u,
    getTyping: u,
    setMyMsgsLastSeenTime: u,
    setTyping: u,
  };
  addChat(pub);
  $('.public-messages').click(() => showChat('public'));
}

export default {init};
