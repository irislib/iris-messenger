/*global describe, it, after, before */
const crypto = require(`crypto`);
const Attribute = require(`Attribute.js`);
const SignedMessage = require(`SignedMessage.js`);
const Contact = require(`Contact.js`);
const Key = require(`Key.js`);

jest.setTimeout(30000);

describe(`SignedMessage`, async () => {
  let msg;
  msg = void 0;
  describe(`createRating method`, async () => {
    test(`should create a rating message`, async () => {
      msg = await SignedMessage.createRating({
        author: {email: `alice@example.com`},
        recipient: {email: `bob@example.com`},
        rating: 5,
        text: `Good guy`
      });
      expect(msg).toHaveProperty(`signedData.time`);
      expect(msg.signedData.type).toEqual(`rating`);
    });
    /*
    test('should get message author and recipient', async () => {
      expect(msg.getAuthor()).toBeInstanceOf(Contact);
      expect(msg.getRecipient()).toBeInstanceOf(Contact);
    });
    */
    test(`should use signing key as author if not defined`, async () => {
      const defaultKey = await Key.getDefault(`.`, undefined, require('fs'));
      msg = await SignedMessage.createRating({
        recipient: {email: `bob@example.com`},
        rating: 5,
        text: `Good guy`
      }, defaultKey);
      expect(msg).toHaveProperty(`signedData.author`);
      expect(JSON.stringify(msg.signedData.author)).toEqual(`{"keyID":"${  Key.getId(defaultKey)  }"}`);
    });
  });
  describe(`createVerification method`, async () => {
    test(`should create a verification message`, async () => {
      msg = await SignedMessage.createVerification({
        author: {email: `alice@example.com`},
        recipient: {email: `bob@example.com`, name: `Bob`},
        text: `Good guy`
      });
      expect(msg).toHaveProperty(`signedData.time`);
      expect(msg.signedData.type).toEqual(`verification`);
    });
  });
  describe(`Recipient iterator`, async () => {
    test(`should go over recipient attributes`, async () => {
      msg = await SignedMessage.createVerification({
        author: {email: `alice@example.com`},
        recipient: {email: `bob@example.com`, name: `Bob`, nickname: [`Bobby`, `Bobbie`]},
        text: `Good guy`
      });
      const seen = {};
      for (const a of msg.getRecipientIterable()) {
        seen[`${a.type  }:${  a.value}`] = true;
      }
      expect(seen.hasOwnProperty(`email:bob@example.com`)).toBe(true);
      expect(seen.hasOwnProperty(`name:Bob`)).toBe(true);
      expect(seen.hasOwnProperty(`nickname:Bobby`)).toBe(true);
      expect(seen.hasOwnProperty(`nickname:Bobbie`)).toBe(true);
    });
  });
  describe(`Validation`, async () => {
    test(`should not accept a message without signedData`, async () => {
      const f = () => {
        new SignedMessage({});
      };
      expect(f).toThrow(Error);
    });
  });
  describe(`methods`, async () => {
    let key;
    msg = void 0;
    beforeAll(async () => {
      msg = await SignedMessage.createRating({
        author: {email: `alice@example.com`},
        recipient: {email: `bob@example.com`},
        rating: 5,
        text: `Good guy`
      });
      key = await Key.generate();
    });
    test(`should be signed with sign()`, async () => {
      await msg.sign(key);
      expect(msg).toHaveProperty(`sig`);
      expect(msg).toHaveProperty(`pubKey`);
      expect(msg).toHaveProperty(`hash`);
    });
    test(`should be verified with verify()`, async () => {
      expect(await msg.verify()).toBe(true);
    });
    test(`serialize & deserialize`, async () => {
      const h = msg.getHash();
      const s = msg.toString();
      const m = await SignedMessage.fromString(s);
      expect(m.getHash()).toEqual(h);
    });
  });
});
