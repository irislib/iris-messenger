import {addChat, showChat} from './Chats.js';
import { translate as t } from './Translation.js';
import {gun} from './Main.js';

let pub;
let callback;

function sendPublicMsg(msg) {
  msg.time = new Date().toISOString();
  gun.user().get('msgs').get(msg.time).put(msg);
}

function getMessages(cb) {
  callback = cb;
  gun.user().get('msgs').map().on(msg => {
    if (typeof msg !== 'object' || !msg.time || pub.messages[msg.time]) { return; }
    pub.messages[msg.time] = msg;
    cb(msg, {selfAuthored: true});
  });
}

function init() {
  const u = () => {};
  pub = {
    name: t('public_messages'),
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
