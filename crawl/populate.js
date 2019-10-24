#!/usr/bin/env node
const { snoowrap } = require('./lib/snoowrap');
const reddit = require('./lib/reddit');

(async () => {
  function sleep(ms){
    return new Promise(resolve=>{
      setTimeout(resolve,ms)
    });
  }

  await reddit.initialize();

  const posts = await snoowrap.getSubreddit('ScientificNutrition')
    .getNew({
      limit: 1000
    });
  posts.forEach(async (s) => {
      await reddit.processSubmission(s);
      await sleep(500);
  });
  console.log(posts.length);
})();
