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
    const $el = $('.hlFld-Fulltext');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processSagePub = ($) => {
    const $el = $('.article__sections');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processExamine = ($) => {
    const $el = $('.article-module-content');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processNewEngland = ($) => {
    const $el = $('.o-article-body__section');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processTand = ($) => {
    const $el = $('.article');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processAha = ($) => {
    const $el = $('.abstractSection');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processNature = ($) => {
    const $el = $('.c-article-section');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processAnnals = ($) => {
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
  const processDiabetesJournals = ($) => {
    const $el = $('.article');

    return {
      text: $el.text(),
      html: $el.html()
    };
  };

  /**
   * @param {cheerio} $
   * @returns {{ html: {string}, text: {string} }}
   */
  const processScienceDaily = ($) => {
    const $el = $('#story_text');

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
    'https://academic.oup.com':                          processOxford,
    'https://jamanetwork.com/journals/jama':             processJama,
    'https://www.thelancet.com/journals/lanpub/article': processLancet,
    'https://journals.sagepub.com/doi/full':             processSagePub,
    // 'https://www.bmj.com/content':                       processBMJ,
    'https://bjsm.bmj.com/content':                      processBMJ,
    'https://heart.bmj.com/content/early':               processBMJ,
    'https://examine.com':                               processExamine,
    'https://www.nejm.org/doi/ful':                      processNewEngland,
    'https://www.tandfonline.com/doi/full':              processTand,
    'https://www.ahajournals.org/doi/full':              processAha,
    'https://www.nature.com/articles':                   processNature,
    'https://annals.org/aim/fullarticle':                processAnnals,
    'https://care.diabetesjournals.org/content':         processDiabetesJournals,
    'https://www.sciencedaily.com/releases':             processScienceDaily
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
          const submission = await reddit.getSubmission(submission_id);
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


