require('dotenv').config();

const RedditAPI = require('reddit-wrapper-v2');
const { createElasticClient } = require('./elastic');
const mysql = require('./mysql');

let elastic;
let reddit;
const foundSubmissionIDs = [];
const foundCommentIDs    = [];

/**
 * @param {number} ms
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * @returns {Promise<void>}
 */
const initialize = () => {
  return new Promise(async (resolve, reject) => {
    mysql.connect();

    if (!elastic) {
      elastic = await createElasticClient().catch((err) => {
        console.error(err);
        reject(err);
      });
    }

    if (!reddit) {
      reddit = new RedditAPI({
        username:              process.env.REDDIT_USER,
        password:              process.env.REDDIT_PASS,
        app_id:                process.env.CLIENT_ID,
        api_secret:            process.env.CLIENT_SECRET,
        user_agent:            'ScientificNutrition-Scraper',
        retry_on_wait:         true,
        retry_on_server_error: 5,
        retry_delay:           1,
        logs:                  true
      });
    }

    resolve(reddit);
  });
};

/**
 * @param {string} id
 * @returns {Promise}
 */
const getSubmission = async (id) => {
  return await elastic.get({
    id,
    index: 'sn_submissions',
    type: 'submission'
  });
};

/**
 * @param {*} submission
 * @returns {Promise<void>}
 */
const processSubmission = async (submission) => {
  return new Promise(async (resolve, reject) => {
    console.log(`${submission.id}: /u/${submission.author} - ${submission.title}`);

    const found = await getSubmission(submission.id)
      .catch((err) => {
        if (err.meta.statusCode !== 404) {
          console.error(err);
        }
      });

    if (found && found.body.found) {
      await elastic.update({
        index: 'sn_submissions',
        id:    submission.id,
        type:  'submission',
        body:  {
          doc: {
            author:      submission.author,
            title:       submission.title,
            created:     submission.created_utc,
            thumbnail:   submission.thumbnail,
            permalink:   submission.permalink,
            url:         submission.url,
            text:        submission.selftext,
            flair:       submission.link_flair_text,
            domain:      submission.domain,
            numComments: submission.num_comments
          }
        }
      });
    } else {
      await elastic.index({
        index: 'sn_submissions',
        id:    submission.id,
        type:  'submission',
        body:  {
          author:      submission.author,
          title:       submission.title,
          created:     submission.created_utc,
          thumbnail:   submission.thumbnail,
          permalink:   submission.permalink,
          url:         submission.url,
          text:        submission.selftext,
          flair:       submission.link_flair_text,
          domain:      submission.domain,
          numComments: submission.num_comments
        }
      });

      if (submission.url) {
        const rows = await mysql.findByURL(submission.url).catch((err) => {
          reject(err);
        });
        if (rows.length === 0) {
          console.log(`Queuing to crawl: ${submission.url}`);
          await mysql.insertURL(submission.id, submission.url).catch((err) => {
            reject(err);
          })
        }
      }
    }

    resolve(submission);
  });
};

/**
 * @param {*} comment
 * @returns {Promise<void>}
 */
const processComment = async (comment) => {
  return new Promise(async (resolve) => {
    if (comment.author.name === 'AutoModerator') {
      resolve(comment);
      return;
    }

    const submissionID = comment.link_id.replace('t3_', '');

    console.log(`${comment.id}:${submissionID} /u/${comment.author} https://www.reddit.com${comment.permalink}`);
    await elastic.index({
      index: 'sn_comments',
      id:    comment.id,
      type:  'comment',
      body:  {
        author:     comment.author,
        permalink:  comment.permalink,
        text:       comment.body,
        parent:     comment.parent_id,
        created:    comment.created_utc,
        submission: submissionID
      }
    });

    resolve(comment);
  });
};

/**
 * @param {boolean} fetchMore
 */
const fetchSubmissions = (fetchMore = true) => {
  reddit.api.get('/r/ScientificNutrition', {
    limit: 100
  }).then(async (resp) => {
    const [status, data] = resp;

    if (status !== 200) {
      // @todo
    }

    const { children } = data.data;
    for(let i = 0; i < children.length; i++) {
      const child = children[i].data;
      if (foundSubmissionIDs.indexOf(child.id) === -1) {
        foundSubmissionIDs.push(child.id);
        await processSubmission(child);
        await sleep(100);
      } else {
        await elastic.update({
          index: 'sn_submissions',
          id:    child.id,
          type:  'submission',
          body:  {
            doc: {
              numComments: child.num_comments
            }
          }
        });
      }
    }

    if (fetchMore) {
      setTimeout(fetchSubmissions, randomNumber(60000, 90000));
    }
  }).catch((err) => {
    console.error(err);
  });
};

/**
 * @param {boolean} fetchMore
 */
const fetchComments = (fetchMore = true) => {
  reddit.api.get('/r/ScientificNutrition/comments.json', {
    limit: 100
  }).then(async (resp) => {
    const [status, data] = resp;

    if (status !== 200) {
      // @todo
    }

    const { children } = data.data;
    for(let i = 0; i < children.length; i++) {
      const child = children[i].data;
      if (foundCommentIDs.indexOf(child.id) === -1) {
        foundCommentIDs.push(child.id);
        await processComment(child);
        await sleep(100);
      }
    }

    if (fetchMore) {
      setTimeout(fetchComments, randomNumber(60000, 90000));
    }
  }).catch((err) => {
    console.error(err);
  });
};

/**
 * @param {boolean} fetchMore
 */
const fetchRemoved = (fetchMore = true) => {
  reddit.api.get('/r/ScientificNutrition/about/spam.json', {
    limit: 100
  }).then(async (resp) => {
    const [status, data] = resp;

    if (status !== 200) {
      // @todo
    }

    const { children } = data.data;
    for(let i = 0; i < children.length; i++) {
      const child = children[i].data;
      if (child.name.indexOf('t1_') === 0) {
        console.log(`Removing comment ${child.id}`);
        await elastic.delete({
          index: 'sn_comments',
          id:    child.id,
          type:  'comment'
        }).catch((err) => {
          if (err.meta.statusCode !== 404) {
            console.error(err);
          }
        });
      } else if (child.name.indexOf('t3_') === 0) {
        console.log(`Removing submission ${child.id}`);
        await elastic.delete({
          index: 'sn_submissions',
          id:    child.id,
          type:  'submission'
        }).catch((err) => {
          if (err.meta.statusCode !== 404) {
            console.error(err);
          }
        });
      }
    }

    if (fetchMore) {
      setTimeout(fetchRemoved, randomNumber(60000, 90000));
    }
  }).catch((err) => {
    console.error(err);
  });
};

module.exports = {
  sleep,
  initialize,
  fetchRemoved,
  fetchComments,
  fetchSubmissions,
  processSubmission,
  processComment,
  getSubmission
};
