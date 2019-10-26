#!/usr/bin/env node
const { createElasticClient } = require('./lib/elastic');

(async () => {
  const elastic = await createElasticClient().catch((err) => {
    console.error(err);
    process.exit(1);
  });

  const submissionMappings = {
    submission: {
      properties: {
        author:       { type: 'keyword' },
        title:        { type: 'text', boost: 2 },
        created:      { type: 'date', format: 'epoch_second' },
        permalink:    { type: 'keyword' },
        thumbnail:    { type: 'keyword' },
        numComments:  { type: 'integer' },
        url:          { type: 'keyword' },
        text:         { type: 'text' },
        flair:        { type: 'keyword' },
        domain:       { type: 'keyword' },
        crawled:      { type: 'text' },
        crawledTitle: { type: 'text' }
      }
    }
  };

  const commentMappings = {
    comment: {
      properties: {
        author:     { type: 'keyword' },
        parent:     { type: 'keyword', index: false },
        submission: { type: 'keyword', index: false },
        text:       { type: 'text' },
        permalink:  { type: 'keyword' },
        created:    { type: 'date', format: 'epoch_second' }
      }
    }
  };

/*  await elastic.indices.delete({
    index: 'sn_submissions'
  }).catch((err) => {
    console.error(err.meta.body);
  });

  await elastic.indices.delete({
    index: 'sn_comments'
  }).catch((err) => {
    console.error(err.meta.body);
  });*/

  let resp = await elastic.indices.exists({
    index: 'sn_submissions'
  });
  if (!resp.body) {
    await elastic.indices.create({
      index: 'sn_submissions',
      body:  {
        mappings: submissionMappings
      }
    }).catch((err) => {
      console.error(err.meta.body);
    });
  } else {
    await elastic.indices.putMapping({
      index: 'sn_submissions',
      type:  'submission',
      body:  submissionMappings
    }).catch((err) => {
      console.error(err.meta.body);
    });
  }

  resp = await elastic.indices.exists({
    index: 'sn_comments'
  });
  if (!resp.body) {
    await elastic.indices.create({
      index: 'sn_comments',
      body:  {
        mappings: commentMappings
      }
    }).catch((err) => {
      console.error(err.meta.body);
    });
  } else {
    await elastic.indices.putMapping({
      index: 'sn_comments',
      type:  'comment',
      body:  commentMappings
    }).catch((err) => {
      console.error(err.meta.body);
    });
  }
})();
