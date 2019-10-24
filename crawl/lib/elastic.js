require('dotenv').config();

const { Client } = require('@elastic/elasticsearch');

exports.createElasticClient = () => {
    return new Promise(async (resolve, reject) => {
        const elastic = new Client({
            node:           process.env.ES_DSN,
            maxRetries:     5,
            requestTimeout: 60000,
            sniffOnStart:   true
        });

        const submissionMappings = {
          submission: {
            properties: {
              author:      { type: 'keyword' },
              title:       { type: 'text' },
              created:     { type: 'date', format: 'epoch_second' },
              permalink:   { type: 'keyword' },
              thumbnail:   { type: 'keyword' },
              numComments: { type: 'integer' },
              url:         { type: 'keyword' },
              text:        { type: 'text' },
              flair:       { type: 'keyword' },
              domain:      { type: 'keyword' }
            }
          }
        };

        const commentMappings = {
          comment: {
            properties: {
              author:    { type: 'keyword' },
              parent_id: { type: 'keyword', index: false },
              text:      { type: 'text' },
              permalink: { type: 'keyword' },
              created:   { type: 'date', format: 'epoch_second' }
            }
          }
        };

/*        await elastic.indices.putMapping({
          index: 'sn_submissions',
          type:  'submission',
          body:  submissionMappings
        });

        await elastic.indices.putMapping({
          index: 'sn_comments',
          type:  'comment',
          body:  commentMappings
        });*/

/*        await elastic.indices.delete({
            index: 'sn_submissions'
        }).catch((err) => {
            reject(err.meta.body);
        });
        await elastic.indices.delete({
            index: 'sn_comments'
        }).catch((err) => {
            reject(err.meta.body);
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
                reject(err.meta.body);
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
                reject(err.meta.body);
            });
        }

        resolve(elastic);
    });
};
