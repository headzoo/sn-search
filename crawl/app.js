#!/usr/bin/env node
const { CommentStream, SubmissionStream } = require('snoostorm');
const { snoowrap } = require('./lib/snoowrap');
const reddit = require('./lib/reddit');

(async () => {
  await reddit.initialize();

  const opts = {
    subreddit: 'ScientificNutrition',
    pollTime:  10000
  };

  const submissions = new SubmissionStream(snoowrap, opts);
  submissions.on('item', reddit.processSubmission);

  const comments = new CommentStream(snoowrap, opts);
  comments.on('item', reddit.processComment);
})();
