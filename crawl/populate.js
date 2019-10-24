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

  /**
   * @param {*} submissions
   * @returns {Promise}
   */
  const processSubmissions = async (submissions) => {
    if (submissions.length === 0) {
      console.log('empty');
      return;
    }

    submissions.forEach(async (s) => {
      await reddit.processSubmission(s);
    });
    await sleep(5000);

    return submissions.fetchMore({ amount: 1000, append: false })
      .then(processSubmissions);
  };

  await snoowrap.getSubreddit('ScientificNutrition')
    .getNew({ limit: 1000 })
    .then(processSubmissions);

  /**
   * @param {Listing} comments
   * @returns {Promise}
   */
  const processComments = async (comments) => {
    if (comments.length === 0) {
      console.log('empty');
      return;
    }

    comments.forEach(async (c) => {
      await reddit.processComment(c);
    });
    await sleep(2000);

    return comments.fetchMore({ amount: 100, append: false })
      .then(processComments);
  };

  await snoowrap.getSubreddit('ScientificNutrition')
    .getNewComments({ limit: 100 })
    .then(processComments);
})();
