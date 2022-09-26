const identifi = require('../cjs/');

identifi.Index.load().then(async (index) => {
  let r = await index.search('ma');
  console.log('Search results for "ma":');
  console.log(JSON.stringify(r, null, 2));
  console.log();
  console.log('Identity profile for martti@moni.com:');
  r = await index.get('martti@moni.com');
  console.log(JSON.stringify(r, null, 2));
  console.log();
  console.log('The most verified name for martti@moni.com:');
  console.log(JSON.stringify(r.verified('name'), null, 2));
})
;
