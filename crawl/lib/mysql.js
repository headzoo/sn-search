require('dotenv').config();

const mysql      = require('mysql');
const connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    database : process.env.MYSQL_NAME
});

connection.connect();

/**
 * @param {string} url
 * @returns {Promise}
 */
const findByURL = (url) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM `crawl` WHERE `url` = ?', [url], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

/**
 * @returns {Promise}
 */
const findUncrawled = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM `crawl` WHERE `is_crawled` = 0', [], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * @param {number} submissionId
 * @param {string} title
 * @param {string} html
 * @returns {Promise}
 */
const markCrawled = (submissionId, title, html) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE `crawl` SET `title` = ?, `html` = ?, `is_crawled` = 1 WHERE `id` = ? LIMIT 1',
      [title, html, submissionId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    )
  });
};

/**
 * @param {string} submissionId
 * @param {string} url
 * @returns {Promise}
 */
const insertURL = (submissionId, url) => {
    return new Promise((resolve, reject) => {
        connection.query(
            "INSERT INTO `crawl` (`submission_id`, `url`, `is_crawled`, `html`, `title`, `date_created`) VALUES(?, ?, 0, '', '', NOW())",
            [submissionId, url],
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
        )
    });
};

module.exports = {
  connection,
  findByURL,
  insertURL,
  markCrawled,
  findUncrawled
};
