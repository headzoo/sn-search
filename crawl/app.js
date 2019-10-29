#!/usr/bin/env node
const reddit = require('./lib/reddit');

(async () => {
  await reddit.initialize();
  reddit.fetchRemoved(true);
  await reddit.sleep(5000);
  reddit.fetchSubmissions(true);
  await reddit.sleep(5000);
  reddit.fetchComments(true);
})();
