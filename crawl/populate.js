#!/usr/bin/env node
const { snoowrap } = require('./lib/snoowrap');
const reddit = require('./lib/reddit');

(async () => {
  const sleep = (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  await reddit.initialize();

/*  const postListings = await snoowrap.getSubreddit('ScientificNutrition')
    .getNew();
  const posts = await postListings.fetchAll();
  posts.forEach(async (s) => {
      await reddit.processSubmission(s);
      await sleep(500);
  });*/

  const processComments = async (comments) => {
    if (comments.length === 0) {
      console.log('empty');
      return;
    }

    comments.forEach(async (c) => {
      await reddit.processComment(c);
    });
    await sleep(2000);

    return comments.fetchMore({ amount: 100 })
      .then(processComments);
  };

  await snoowrap.getSubreddit('ScientificNutrition')
    .getNewComments({ limit: 100 })
    .then(processComments);

/*  const commentPromises = [];
  const commentListings = await snoowrap.getSubreddit('ScientificNutrition')
    .getNewComments();
  const comments = await commentListings.fetchAll();
  comments.forEach((c) => {
    commentPromises.push(reddit.processComment(c));
  });

  Promise.all(commentPromises)
    .then(() => {
      console.log('done!');
    });*/
})();
