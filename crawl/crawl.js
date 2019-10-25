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
   * @returns {{ html: {string}, text: {string} }}
   */
  const processPubMed = ($) => {
    const $el = $('.abstr div');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processPubMedMobile = ($) => {
    const $el = $('.no_t_m');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processPubMedArticle = ($) => {
    const $el = $('.article p');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processScienceDirect = ($) => {
    const $el = $('.abstract div');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processOxford = ($) => {
    const $el = $('.abstract');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processBMJ = ($) => {
    const $el = $('.abstract');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processJama = ($) => {
    const $el = $('.article-full-text');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processLancet = ($) => {
    const $el = $('.article__sections');

    return {
      text: $el.text(),
      html: $el.html()
    };
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
        await mysql.markCrawled(row.id, '');
      }
      return;
    }

    await curl.get(url, null, async (err, resp, body) => {
      if (err) {
        console.error(err);
        await mysql.markCrawled(row.id, '');
      } else if (resp.statusCode === 200){
        let text;
        let html;

        for (const key in supported) {
          if (url.indexOf(key) === 0) {
            console.log(`${submission_id}: ${url}`);
            ({ text, html } = supported[key](cheerio.load(body)));
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

        await mysql.markCrawled(row.id, html || '');
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


