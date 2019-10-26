#!/usr/bin/env node
const reddit = require('./lib/reddit');

(async () => {
  const redditConn = await reddit.initialize();

  let submissionsAfter = '';
  let commentsAfter    = '';

  /**
   *
   */
  const fetchSubmissions = () => {
    redditConn.api.get('/r/ScientificNutrition', {
      limit: 100,
      after: submissionsAfter
    }).then(async (resp) => {
      const [status, data] = resp;

      if (status !== 200) {
        // @todo
      }

      submissionsAfter = data.data.after;
      const { children } = data.data;
      for(let i = 0; i < children.length; i++) {
        const child = children[i].data;
        await reddit.processSubmission(child);
      }

      if (submissionsAfter) {
        setTimeout(fetchSubmissions, 10000);
      }
    });
  };

  fetchSubmissions();

  /**
   *
   */
  const fetchComments = () => {
    redditConn.api.get('/r/ScientificNutrition/comments.json', {
      limit: 100,
      after: commentsAfter
    }).then(async (resp) => {
      const [status, data] = resp;

      if (status !== 200) {
        // @todo
      }

      commentsAfter = data.data.after;
      const { children } = data.data;
      for (let i = 0; i < children.length; i++) {
        const child = children[i].data;
        await reddit.processComment(child);
      }

      if (commentsAfter) {
        setTimeout(fetchComments, 10000);
      }
    });
  };

  fetchComments();
})();
