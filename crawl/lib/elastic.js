require('dotenv').config();

const { Client } = require('@elastic/elasticsearch');

let elastic;

exports.createElasticClient = () => {
  if (elastic) {
    return Promise.resolve(elastic);
  }

  return new Promise(async (resolve) => {
    elastic = new Client({
      node:           process.env.ES_DSN,
      maxRetries:     5,
      requestTimeout: 60000,
      sniffOnStart:   true
    });

    resolve(elastic);
  });
};
