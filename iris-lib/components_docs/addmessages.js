const identifi = require('../cjs/index.js');
const IPFS = require('ipfs');
const fs = require('fs');

let key, ipfsNode;
async function init() {
  key = identifi.Key.getDefault();
  ipfsNode = new IPFS({repo: './ipfs_repo'});
  await new Promise((resolve, reject) => {
    ipfsNode.on('ready', () => {
      console.log('ipfs ready');
      resolve();
    });
    ipfsNode.on('error', error => {
      console.error(error.message);
      reject();
    });
  });
  return true;
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

init().then(async () => {
  console.log(1);
  const i = await identifi.Index.create(ipfsNode);
  console.log(11);
  const msgs = [];
  let msg = identifi.Message.createRating({recipient: [['email', 'bob@example.com']], rating:10}, key);
  msgs.push(msg);
  msg = identifi.Message.createRating({author: [['email', 'bob@example.com']], recipient: [['email', 'bob1@example.com']], rating:10}, key);
  msgs.push(msg);
  for (let i = 0;i < 10;i++) {
    msg = identifi.Message.createRating({author: [['email', `bob${i}@example.com`]], recipient: [['email', `bob${i+1}@example.com`]], rating:10}, key);
    msgs.push(msg);
  }
  msg = identifi.Message.createRating({author: [['email', 'bert@example.com']], recipient: [['email', 'chris@example.com']], rating:10}, key);
  msgs.push(msg);
  await i.addMessages(shuffle(msgs));
  p = await i.get('bob10@example.com');
  console.log(111,p);
  p = await i.get('bert@example.com');
  console.log(1111,p);
  p = await i.get('chris@example.com');
  console.log(11111,p);
  await ipfsNode.stop();
  console.log('ipfsNode stopped');
});
