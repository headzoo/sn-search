require('dotenv').config();

const mysql = require('mysql');

let connection;

/**
 *
 */
const connect = () => {
  connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    database : process.env.MYSQL_NAME
  });
  connection.connect();
/*  connection.on('error', (err) => {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      connect();
    } else {
      throw err;
    }
  });*/
};

/**
 * @returns {*}
 */
const getConnection = () => {
  return connection;
};

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
const findAll = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM `crawl`', [], (err, result) => {
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
      [title.substr(0, 255), html, submissionId],
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
  connect,
  getConnection,
  findByURL,
  insertURL,
  markCrawled,
  findAll,
  findUncrawled
};
