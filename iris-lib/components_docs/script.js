let index, msg, key;

gun = new Gun(['http://localhost:8765/gun']);

index = new window.irisLib.Index({gun}); // <--- Create identifi index

index.ready.then(async () => {
  document.getElementById('searchResults').textContent = 'Searching...';
  document.getElementById('profileResults').textContent = 'Searching...';
  await search(index);
  await getProfile(index);
  document.getElementById('query').addEventListener('change', search);
  document.getElementById('profileQuery').addEventListener('change', getProfile);
  document.getElementById('signMsg').addEventListener('click', signMsg);
  document.getElementById('publishMsg').addEventListener('click', publishMsg);
  document.getElementById('runIndexExample').addEventListener('click', runIndexExample);
  const searchWidget = document.getElementById('searchWidget');
  window.irisLib.Identity.appendSearchWidget(searchWidget, index);
});

async function search() {
  const query = document.getElementById('query').value;

  let r = await index.search(query); // <--- Search identities from identifi

  let text = `Search results for "${query}":\n`;
  document.getElementById('searchResults').textContent = text;
  r.sort((a, b) => {return a.trustDistance - b.trustDistance;});
  r.forEach(i => {
    console.log('ii', i);
    document.getElementById('searchResults').appendChild(i.profileCard());
  });
}

async function getProfile() {
  const profileQuery = document.getElementById('profileQuery').value;
  const identiconParent = document.getElementById('identicon');
  const verifiedAttributeEl = document.getElementById('verifiedAttribute');

  i = await index.get(profileQuery); // <--- Get an identity from identifi

  let text = `Identity profile for ${profileQuery}:\n`;
  if (i) {
    const data = await new Promise(resolve => i.gun.load(r => resolve(r)));
    text += JSON.stringify(data, null, 2);
    const verifiedName = await i.verified('name'); // <--- Get a verified name of an identity
    verifiedAttributeEl.textContent = verifiedName;

    console.log('i', i);
    const identicon = i.identicon(100); // <--- Generate an identity icon as a DOM element, width 100px
    identiconParent.innerHTML = '';
    identiconParent.appendChild(identicon);
  } else {
    identiconParent.innerHTML = '';
    verifiedAttributeEl.innerHTML = '-';
    text += 'Profile not found'
  }
  document.getElementById('profileResults').textContent = text;
}

function signMsg() {
  const d = document.getElementById('ratingMsg').value;
  const msgData = JSON.parse(d);
  window.message = window.irisLib.Message.createRating(msgData); // <--- Create an Identifi message
  key = window.irisLib.Key.getDefault(); // <--- Get or generate local key
  window.message.sign(key); // <--- Sign message with the key
  document.getElementById('signMsgResult').textContent = JSON.stringify(window.message, null, 2);
}

async function publishMsg() {
  const r = await index.addMessage(window.message);
  document.getElementById('publishMsgResult').textContent = JSON.stringify(r);
  if (r && r.hash) {
    const link = `https://ipfs.io/ipfs/${r.hash}`;
    const el = document.getElementById('publishMsgResultLink');
    el.className = `alert alert-info`;
    el.innerHTML = `<a href="${link}">${link}</a>`;
  }
}

async function runIndexExample() {
  el = document.getElementById('runIndexExampleResult');
  el.innerHTML = '';

  ipfs = new window.Ipfs();
  await new Promise((resolve, reject) => {
    ipfs.on('ready', () => {
      console.log('ipfs ready');
      resolve();
    });
    ipfs.on('error', error => {
      console.error(error.message);
      reject();
    });
  });
  index = new window.irisLib.Index({gun, ipfs});
  myKey = window.irisLib.Key.getDefault('.');
  msg = window.irisLib.Message.createVerification({
    recipient: {'keyID': myKey.keyID, 'name': 'Alice Example'},
    comment: 'add name'
  }, myKey);
  await index.addMessage(msg);
  msg2 = window.irisLib.Message.createRating({
    recipient: {'email': 'bob@example.com'},
    rating: 5
  }, myKey);
  await index.addMessage(msg2);
  identities = await index.search('');
  el.innerHTML += 'Identities in index:\n'
  el.innerHTML += JSON.stringify(identities, null, 2);
  uri = await index.save();
  el.innerHTML += '\nSaved index URI: ' + uri
}
