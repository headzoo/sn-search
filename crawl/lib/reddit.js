const { createElasticClient } = require('./elastic');
const mysql = require('./mysql');

let elastic;

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
      created:     submission.created,
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

  console.log(`${comment.author.name}`);
  elastic.index({
    index: 'sn_comments',
    id:    comment.id,
    type:  'comment',
    body:  {
      author:    comment.author.name,
      permalink: comment.permalink,
      text:      comment.body,
      parent_id: comment.parent_id,
      created:   comment.created
    }
  });
};

module.exports = {
  initialize,
  processComment,
  processSubmission,
  fetchSubmission
};
