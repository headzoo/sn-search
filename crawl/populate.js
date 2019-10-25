#!/usr/bin/env node
const reddit = require('./lib/reddit');

(async () => {
  await reddit.initialize();
  reddit.fetchSubmissions(false);
  await reddit.sleep(5000);
  reddit.fetchComments(false);
})();
