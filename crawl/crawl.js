#!/usr/bin/env node
const curl    = require('curl');
const cheerio = require('cheerio');
const mysql   = require('./lib/mysql');
const reddit  = require('./lib/reddit');
const { createElasticClient } = require('./lib/elastic');

(async () => {
  await reddit.initialize();
  const elastic = await createElasticClient();

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processPubMed = ($) => {
    return $('.abstr div').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processPubMedMobile = ($) => {
    return $('.no_t_m').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processPubMedArticle = ($) => {
    return $('.article p').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processScienceDirect = ($) => {
    return $('.abstract div').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processOxford = ($) => {
    return $('.abstract').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processBMJ = ($) => {
    return $('.abstract').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processJama = ($) => {
    return $('.article-full-text').text();
  };

  /**
   * @param {cheerio} $
   * @returns {string}
   */
  const processLancet = ($) => {
    return $('.article__sections').text();
  };

  const supported = {
    'https://www.ncbi.nlm.nih.gov/pubmed':               processPubMed,
    'https://www.ncbi.nlm.nih.gov/m/pubmed':             processPubMedMobile,
    'https://www.ncbi.nlm.nih.gov/pmc/article':          processPubMedArticle,
    'https://www.sciencedirect.com/science/article/pii': processScienceDirect,
    'https://academic.oup.com/ajcn':                     processOxford,
    'https://academic.oup.com/jn/article':               processOxford,
    'https://jamanetwork.com/journals/jama':             processJama,
    'https://www.thelancet.com/journals/lanpub/article': processLancet,
    // 'https://www.bmj.com/content':                       processBMJ
  };

  /**
   * @param {*} row
   * @returns {Promise}
   */
  const crawl = async (row) => {
    const { url, submission_id } = row;

    let found = false;
    for (const key in supported) {
      if (url.indexOf(key) === 0) {
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`Skipping ${url}`);
      if (url.indexOf('https://www.reddit.com') === 0 || url.indexOf('https://reddit.com') === 0) {
        await mysql.markCrawled(row.id);
      }
      return;
    }

    await curl.get(url, null, async (err, resp, body) => {
      if(resp.statusCode === 200){
        let text;
        for (const key in supported) {
          if (url.indexOf(key) === 0) {
            console.log(`${submission_id}: ${url}`);
            text = supported[key](cheerio.load(body));
            break;
          }
        }

        if (text) {
          const submission = await reddit.fetchSubmission(submission_id);
          if (submission.body.found) {
            await elastic.update({
              index: 'sn_submissions',
              type:  'submission',
              id:    submission_id,
              body:  {
                doc: {
                  crawled: text
                }
              }
            });
          }
        }

        await mysql.markCrawled(row.id);
      } else{
        console.log(`error while fetching ${url}`);
      }
    });
  };

  mysql.findUncrawled()
    .then((rows) => {
      // crawl(rows[2]);
      rows.forEach(crawl);
    });
})();


