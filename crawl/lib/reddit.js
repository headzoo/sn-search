const { snoowrap } = require('./snoowrap');
const { createElasticClient } = require('./elastic');
const mysql = require('./mysql');

let elastic;

const sleep = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

/**
 * @returns {Promise<void>}
 */
const initialize = async () => {
  if (!elastic) {
    elastic = await createElasticClient().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
};

/**
 * @param {*} submission
 * @returns {Promise<void>}
 */
const processSubmission = async (submission) => {
  console.log(`${submission.id}: ${submission.title} - ${submission.author.name}`);
  elastic.index({
    index: 'sn_submissions',
    id:    submission.id,
    type:  'submission',
    body:  {
      author:      submission.author.name,
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
      console.error(err);
    });
    if (rows.length === 0) {
      console.log(`Queuing to crawl: ${submission.url}`);
      await mysql.insertURL(submission.id, submission.url).catch((err) => {
        console.error(err);
      })
    }
  }
};

/**
 * @param {string} id
 * @returns {Promise}
 */
const fetchSubmission = async (id) => {
  return await elastic.get({ id, index: 'sn_submissions', type: 'submission' })
};

/**
 * @param {*} comment
 * @returns {Promise<void>}
 */
const processComment = async (comment) => {
  if (comment.author.name === 'AutoModerator') {
    return;
  }

  const submissionID = comment.link_id.replace('t3_', '');

  console.log(`${comment.id}:${submissionID} ${comment.author.name} https://www.reddit.com${comment.permalink}`);
  await elastic.index({
    index: 'sn_comments',
    id:    comment.id,
    type:  'comment',
    body:  {
      author:     comment.author.name,
      permalink:  comment.permalink,
      text:       comment.body,
      parent:     comment.parent_id,
      created:    comment.created_utc,
      submission: submissionID
    }
  });

  await sleep(2000);
  const submission  = await snoowrap.getSubmission(submissionID);
  const numComments = await submission.num_comments;
  await elastic.update({
    index: 'sn_comments',
    id:    comment.id,
    type:  'comment',
    body:  {
      doc: {
        numComments
      }
    }
  });
};

module.exports = {
  initialize,
  processComment,
  processSubmission,
  fetchSubmission
};
