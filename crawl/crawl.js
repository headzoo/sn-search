#!/usr/bin/env node
const curl    = require('curl');
const cheerio = require('cheerio');
const commandLineArgs = require('command-line-args');
const mysql   = require('./lib/mysql');
const reddit  = require('./lib/reddit');
const { createElasticClient } = require('./lib/elastic');

const optionDefinitions = [
  { name: 'url', alias: 'u', type: String },
  { name: 'recrawl', type: Boolean }
];
const options = commandLineArgs(optionDefinitions);

(async () => {
  await reddit.initialize();
  const elastic = await createElasticClient();

  const supported = {
    'https://www.ncbi.nlm.nih.gov/pubmed':               '.abstr div',
    'https://www.ncbi.nlm.nih.gov/m/pubmed':             '.no_t_m',
    'https://www.ncbi.nlm.nih.gov/pmc/articles':         '.tsec',
    'https://www.ncbi.nlm.nih.gov/pmc/article':          '.article p',
    'https://www.sciencedirect.com/science/article/pii': '.abstract div',
    'https://academic.oup.com':                          '.abstract',
    'https://jamanetwork.com/journals/jama':             '.article-full-text',
    'https://www.thelancet.com/journals/lanpub/article': '.hlFld-Fulltext',
    'https://journals.sagepub.com/doi/full':             '.article__sections',
    'https://www.bmj.com/content':                       '.abstract',
    'https://bjsm.bmj.com/content':                      '.abstract',
    'https://heart.bmj.com/content/early':               '.abstract',
    'https://examine.com':                               '.article-module-content',
    'https://www.nejm.org/doi/ful':                      '.o-article-body__section',
    'https://www.tandfonline.com/doi/full':              '.article',
    'https://www.ahajournals.org/doi/full':              '.abstractSection',
    'https://www.nature.com/articles':                   '.c-article-section',
    'https://annals.org/aim/fullarticle':                '.abstract',
    'https://care.diabetesjournals.org/content':         '.article',
    'https://www.sciencedaily.com/releases':             '#story_text'
  };

  /**
   * @param {string} url
   * @returns {Promise}
   */
  const fetch = (url) => {
    return new Promise(async (resolve, reject) => {
      curl.get(url, null, (err, resp, body) => {
        if (err) {
          reject(err);
          return;
        }

        if (resp.statusCode === 200){
          let text;
          let html;
          let title;

          for (const key in supported) {
            if (url.indexOf(key) === 0) {
              const $   = cheerio.load(body);
              const $el = $(supported[key]);
              title     = $('title').text();
              text      = $el.text();
              html      = $el.html();
              break;
            }
          }

          resolve({
            title, text, html
          });
        } else{
          reject(`error while fetching ${url}`);
        }
      });
    });
  };

  /**
   * @param {*} row
   * @returns {Promise}
   */
  const crawl = async (row) => {
    return new Promise(async (resolve, reject) => {
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
          await mysql.markCrawled(row.id, '', '');
        }
        resolve();
        return;
      }

      await curl.get(url, null, async (err, resp, body) => {
        if (err) {
          await mysql.markCrawled(row.id, '', '');
          reject(err);
          return;
        }

        if (resp.statusCode === 200){
          let text = '';
          let html = '';
          let title = '';

          for (const key in supported) {
            if (url.indexOf(key) === 0) {
              console.log(`${submission_id}: ${url}`);

              const $ = cheerio.load(body);
              let $el;
              if (typeof supported[key] === 'function') {
                $el = supported[key]($);
              } else {
                $el = $(supported[key]);
              }

              title = $('title').text();
              html  = $el.html();
              $el.find('*').each((i, el) => {
                text += $(el).text() + "\n";
              });
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
                    crawled:      text,
                    crawledTitle: title
                  }
                }
              });
            }
          }

          await mysql.markCrawled(row.id, title || '', html || '');
        } else{
          reject(`error while fetching ${url}`);
        }

        resolve();
      });
    });
  };

  if (options.url) {
    const rows = await mysql.findByURL(options.url);
    if (rows.length > 0) {
      await crawl(rows[0]);
    }
    process.exit(0);
  }

  if (options.recrawl) {
    mysql.findAll()
      .then(async (rows) => {
        for(let i = 0; i < rows.length; i++) {
          await crawl(rows[i]).catch((err) => {
            console.error(err);
          });
        }
      });
  } else {
    mysql.findUncrawled()
      .then(async (rows) => {
        for(let i = 0; i < rows.length; i++) {
          await crawl(rows[i]).catch((err) => {
            console.error(err);
          });
        }
      });
  }
})();


