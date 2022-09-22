const iris = require(`index.js`);
const GUN = require(`gun`);
const SEA = require(`gun/sea`);
const load = require(`gun/lib/load`);
const then = require(`gun/lib/then`);
const radix = require(`gun/lib/radix`); // Require before instantiating Gun, if running in jsdom mode

const server = require('http').createServer(GUN.serve);
const superNode = GUN({radisk: false, web: server.listen(8768), multicast: false });
const gun1 = new GUN({radisk: false, multicast: false, peers: ['http://localhost:8768/gun']});
const gun2 = new GUN({radisk: false, multicast: false, peers: ['http://localhost:8768/gun']});

const logger = function()
{
  let oldConsoleLog = null;
  const pub = {};

  pub.enable =  function enable()
  {
    if (oldConsoleLog == null)
      return;

    window[`console`][`log`] = oldConsoleLog;
  };

  pub.disable = function disable()
  {
    oldConsoleLog = console.log;
    window[`console`][`log`] = function() {};
  };

  return pub;
}();
logger.disable();

test(`User1 says hi`, async (done) => {
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user2Channel = new iris.Channel({ gun: gun2, key: user2, participants: user1.pub });
  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: user2.pub
  });
  user1Channel.getMessages((msg, info) => {
    expect(msg.text).toEqual(`hi`);
    expect(info.selfAuthored).toBe(true);
    done();
  });
  user1Channel.send(`hi`);
});
test(`Set and get msgsLastSeenTime`, async (done) => {
  const user1 = await iris.Key.generate();
  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: user1.pub
  });
  const t = new Date();
  user1Channel.setMyMsgsLastSeenTime();
  user1Channel.getMyMsgsLastSeenTime(time => {
    expect(time).toBeDefined();
    expect(new Date(time).getTime()).toBeGreaterThanOrEqual(t.getTime());
    done();
  });
});

test(`User2 says hi`, async (done) => {
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: user2.pub,
  });

  const user2Channel = new iris.Channel({ gun: gun2, key: user2, participants: user1.pub });
  user2Channel.send(`hi`);
  user1Channel.getMessages((msg) => {
    if (msg.text === `hi`) {
      done();
    }
  });
});

test(`3 users send and receive messages and key-value pairs on a group channel`, async (done) => {
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user3 = await iris.Key.generate();
  iris.Channel.initUser(gun1, user1);
  iris.Channel.initUser(gun2, user2);
  iris.Channel.initUser(superNode, user3);

  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: [user2.pub, user3.pub]
  });
  expect(typeof user1Channel.uuid).toBe('string');
  expect(typeof user1Channel.myGroupSecret).toBe('string');
  expect(user1Channel.uuid.length).toBe(36);
  user1Channel.send('1')
  user1Channel.put('name', 'Champions');

  const r1 = [];
  const r2 = [];
  const r3 = [];
  let user1MsgsReceived, user2MsgsReceived, user3MsgsReceived, putReceived1, putReceived2, putReceived3;
  function checkDone() {
    if (user1MsgsReceived && user2MsgsReceived && user3MsgsReceived && putReceived1 && putReceived2 && putReceived3) {
      done();
    }
  }
  user1Channel.getMessages((msg) => {
    r1.push(msg.text);
    if (r1.indexOf('1') >= 0 && r1.indexOf('2') >= 0 && r1.indexOf('3') >= 0) {
      user1MsgsReceived = true;
      checkDone();
    }
  });
  user1Channel.on('name', name => {
    putReceived1 = name === 'Champions';
    checkDone();
  });

  const user2Channel = new iris.Channel({ gun: gun2, key: user2, participants: [user1.pub, user3.pub], uuid: user1Channel.uuid });
  user2Channel.send('2');
  expect(user2Channel.uuid).toEqual(user1Channel.uuid);
  expect(typeof user2Channel.myGroupSecret).toBe('string');
  user2Channel.getMessages((msg) => {
    r2.push(msg.text);
    if (r2.indexOf('1') >= 0 && r2.indexOf('2') >= 0 && r2.indexOf('3') >= 0) {
      user2MsgsReceived = true;
      checkDone();
    }
  });
  user2Channel.on('name', name => {
    putReceived2 = name === 'Champions';
    checkDone();
  });

  const user3Channel = new iris.Channel({ gun: superNode, key: user3, participants: [user1.pub, user2.pub], uuid: user1Channel.uuid });
  user3Channel.send('3');
  expect(user3Channel.uuid).toEqual(user1Channel.uuid);
  expect(typeof user3Channel.myGroupSecret).toBe('string');
  user3Channel.getMessages((msg) => {
    r3.push(msg.text);
    if (r3.indexOf('1') >= 0 && r3.indexOf('2') >= 0 && r3.indexOf('3') >= 0) {
      user3MsgsReceived = true;
      checkDone();
    }
  });
  user3Channel.on('name', name => {
    putReceived3 = name === 'Champions';
    checkDone();
  });
});

test(`create new channel, send messages, add participants afterwards`, async (done) => {
  return done(); // temp disabled
  logger.enable();
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user3 = await iris.Key.generate();
  console.log(1, user1.pub.slice(0,4));
  console.log(2, user2.pub.slice(0,4));
  console.log(3, user3.pub.slice(0,4));
  iris.Channel.initUser(gun1, user1);
  iris.Channel.initUser(gun2, user2);
  iris.Channel.initUser(superNode, user3);

  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: []
  });
  const chatLink = user1Channel.getSimpleLink();
  expect(typeof user1Channel.uuid).toBe('string');
  expect(typeof user1Channel.myGroupSecret).toBe('string');
  expect(user1Channel.uuid.length).toBe(36);
  user1Channel.send('1')
  user1Channel.put('name', 'Champions');

  user1Channel.addParticipant(user2.pub);
  user1Channel.addParticipant(user3.pub);

  const r1 = [];
  const r2 = [];
  const r3 = [];
  let user1MsgsReceived, user2MsgsReceived, user3MsgsReceived, putReceived1, putReceived2, putReceived3;
  function checkDone() {
    if (user1MsgsReceived && user2MsgsReceived && user3MsgsReceived && putReceived1 && putReceived2 && putReceived3) {
      logger.disable();
      done();
    }
  }
  user1Channel.getMessages((msg) => {
    r1.push(msg.text);
    console.log('user1', r1);
    if (r1.indexOf('1') >= 0 && r1.indexOf('2') >= 0 && r1.indexOf('3') >= 0) {
      user1MsgsReceived = true;
      checkDone();
    }
  });
  user1Channel.on('name', name => {
    putReceived1 = name === 'Champions';
    checkDone();
  });

  setTimeout(() => { // with separate gun instances would work without timeout?
    const user2Channel = new iris.Channel({ gun: gun2, key: user2, chatLink });
    user2Channel.send('2');
    expect(user2Channel.uuid).toEqual(user1Channel.uuid);
    expect(typeof user2Channel.myGroupSecret).toBe('string');
    user2Channel.getMessages((msg) => {
      r2.push(msg.text);
      console.log('user2', r2);
      if (r2.indexOf('1') >= 0 && r2.indexOf('2') >= 0 && r2.indexOf('3') >= 0) {
        user2MsgsReceived = true;
        checkDone();
      }
    });
    user2Channel.on('name', name => {
      putReceived2 = name === 'Champions';
      checkDone();
    });
  }, 500);

  setTimeout(() => {
    const user3Channel = new iris.Channel({ gun: superNode, key: user3, chatLink });
    user3Channel.send('3');
    expect(user3Channel.uuid).toEqual(user1Channel.uuid);
    expect(typeof user3Channel.myGroupSecret).toBe('string');
    user3Channel.getMessages((msg) => {
      r3.push(msg.text);
      console.log('user3', r3);
      if (r3.indexOf('1') >= 0 && r3.indexOf('2') >= 0 && r3.indexOf('3') >= 0) {
        user3MsgsReceived = true;
        checkDone();
      }
    });
    user3Channel.on('name', name => {
      putReceived3 = name === 'Champions';
      checkDone();
    });
  }, 1000);
});

test(`Join a channel using a simple chat link`, async (done) => {
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user3 = await iris.Key.generate();
  iris.Channel.initUser(gun1, user1);
  iris.Channel.initUser(gun2, user2);
  iris.Channel.initUser(superNode, user3);

  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: [user2.pub, user3.pub]
  });

  const chatLink = user1Channel.getSimpleLink();

  setTimeout(() => {
    const user2Channel = new iris.Channel({gun: gun2, key: user2, chatLink});
    expect(user2Channel.uuid).toBe(user1Channel.uuid);
    expect(Object.keys(user2Channel.participants).length).toBe(2);
    user2Channel.onTheir('participants', pants => {
      expect(typeof pants).toBe('object');
      expect(Object.keys(pants).length).toBe(3);
      expect(Object.keys(user2Channel.participants).length).toBe(3);
      done();
    });
  }, 500);
});

test(`Retrieve chat links`, async (done) => {
  const user1 = await iris.Key.generate();
  iris.Channel.initUser(gun1, user1);
  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: []
  });
  const chatLink = await user1Channel.createChatLink();
  user1Channel.getChatLinks(link => {
    expect(link).toBeDefined();
    expect(link.url).toEqual(chatLink);
    done();
  });
});

test(`Join a channel using an advanced chat link`, async (done) => {
  logger.enable();

  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  const user3 = await iris.Key.generate();
  iris.Channel.initUser(gun1, user1);
  iris.Channel.initUser(gun2, user2);
  iris.Channel.initUser(superNode, user3);

  const user1Channel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: [user3.pub]
  });

  const chatLink = await user1Channel.createChatLink();

  setTimeout(() => {
    const user2Channel = new iris.Channel({gun: gun2, key: user2, chatLink});
    console.log(1, chatLink);
    console.log(2, user2Channel);
    expect(user2Channel.uuid).toBe(user1Channel.uuid);
    expect(Object.keys(user2Channel.participants).length).toBe(2);
    user2Channel.onTheir('participants', pants => {
      expect(typeof pants).toBe('object');
      expect(Object.keys(pants).length).toBe(3);
      expect(Object.keys(user2Channel.participants).length).toBe(3);
      logger.disable();
      done();
    });
  }, 500);
});

test(`Save and retrieve direct and group channels`, async (done) => {
  const user1 = await iris.Key.generate();
  const user2 = await iris.Key.generate();
  iris.Channel.initUser(gun2, user2); // TODO direct chat is not saved unless the other guy's epub is found
  const user3 = await iris.Key.generate();
  const directChannel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: user2.pub
  });
  const groupChannel = new iris.Channel({
    gun: gun1,
    key: user1,
    participants: [user2.pub, user3.pub]
  });
  let direct, group;
  iris.Channel.getChannels(gun1, user1, channel => {
    if (channel.uuid) {
      group = channel;
    } else {
      direct = channel;
    }
    if (group && direct) {
      expect(direct.getId()).toBe(user2.pub);
      expect(group.getId()).toBe(groupChannel.uuid);
      expect(groupChannel.getCurrentParticipants().length).toBe(2);
      expect(group.getCurrentParticipants().length).toBe(2);
      done();
    }
  });
});
