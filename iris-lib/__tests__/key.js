const iris = require(`index.js`);
const fs = require(`fs`);

jest.setTimeout(30000);

beforeAll(() => {
  if (fs.existsSync(`./private.key`)) {
    const f = fs.unlinkSync(`./private.key`);
  }
});
test(`Generate key`, async () => {
  const i = await iris.Key.generate();
  expect(i).toBeDefined();
});
test(`Serialize and deserialize a key`, async () => {
  const i = await iris.Key.generate();
  const serialized = iris.Key.toString(i);
  expect(typeof serialized).toBe(`string`);
  const deserialized = iris.Key.fromString(serialized);
  expect(typeof deserialized).toBe(`object`);
  expect(i).toBeDefined();
});
test(`Get default key and sign a message with it`, async () => {
  const i = await iris.Key.getDefault(`.`, undefined, fs);
  expect(i).toBeDefined();
  const j = await iris.Key.getDefault(`.`, undefined, fs);
  expect(i).toEqual(j);
  const msg = await iris.SignedMessage.createRating({
    author: {email: `alice@example.com`},
    recipient: {email: `bob@example.com`},
    rating: 5,
    comment: `Good guy`
  });
  await msg.sign(i);
  expect(await msg.verify()).toBe(true);
});
afterAll(() => {
  if (fs.existsSync(`./private.key`)) {
    const f = fs.unlinkSync(`./private.key`);
  }
});
