/**
 * @file **gab (nazi-twitter)** crawl posts for user 
*/
const path = require('path');

const axios = require('axios');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const puppeteer = require('puppeteer');
const request_client = require('request-promise-native');

const fs = require('fs').promises;
const url = require('url');
const { isBuffer } = require('util');

const timeout = 7000;
const run_headless = false;
let browser;

class Utils {
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  objectArrayToCSV({
    data = null,
    columnDelimiter = ',',
    lineDelimiter = '\n',
  }) {
    let result, ctr, keys;

    if (data === null || !data.length) {
      return null;
    }

    keys = Object.keys(data[0]);
    console.log(keys);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach((item) => {
      ctr = 0;
      keys.forEach((key) => {
        if (ctr > 0) {
          result += columnDelimiter;
        }

        result +=
          typeof item[key] === 'string' && item[key].includes(columnDelimiter)
            ? `"${item[key]}"`
            : item[key];
        ctr++;
      });
      result += lineDelimiter;
    });

    return result;
  }
}

function objectArrayToCSV({
  data = null,
  columnDelimiter = ',',
  lineDelimiter = '\n',
}) {
  let result, ctr, keys;

  if (data === null || !data.length) {
    return null;
  }

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach((item) => {
    ctr = 0;
    keys.forEach((key) => {
      if (ctr > 0) {
        result += columnDelimiter;
      }

      result +=
        typeof item[key] === 'string' && item[key].includes(columnDelimiter)
          ? `"${item[key]}"`
          : item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}

class GabCrawler {
  async getUserPosts(pagename, limit = 3, callback) {
    let self = this;
    try {
      console.log(limit);

      if (browser == null)
        browser = await puppeteer.launch({
          headless: run_headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      const page = await browser.newPage();
      const cookiesString = await fs.readFile('./cookies.json');
      const cookies = JSON.parse(cookiesString);
      let interval;
      await page.setCookie(...cookies);

      let results = [];
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        try {
          request_client({
            uri: request.url(),
            resolveWithFullResponse: true,
          })
            .then((response) => {
              var request_url = request.url();
              const response_body = response.body;

              var max_id = 0;
              if (request_url.indexOf('/statuses?exclude_replies=true') > -1) {
                console.log(request_url);

                if (request_url.indexOf('max_id') > -1) {
                  clearInterval(interval);
                  axios.get(request_url).then(
                    (response) => {
                      for (let i in response.data) {
                        if (max_id === 0)
                          max_id = parseInt(response.data[i].id);
                        if (max_id > parseInt(response.data[i].id)) {
                          max_id = parseInt(response.data[i].id);
                        }
                        results.push(response.data[i]);
                      }

                      console.log(limit, max_id);
                      loopStatuses();
                    },
                    (error) => {
                      console.log(error);
                    }
                  );
                  let base_url = request_url.slice(0, -18);
                  function loopStatuses() {
                    if (limit >= 0) {
                      setTimeout(function () {
                        console.log(base_url + max_id);
                        axios.get(base_url + max_id).then(
                          (response) => {
                            for (let i in response.data) {
                              if (max_id === 0)
                                max_id = parseInt(response.data[i].id);
                              if (max_id > parseInt(response.data[i].id)) {
                                max_id = parseInt(response.data[i].id);
                              }

                              results.push(response.data[i]);
                            }
                            console.log(1, limit, max_id);
                            console.log(results.length + ' tweets collected');
                            loopStatuses();
                          },
                          (error) => {
                            console.log(error);
                          }
                        );
                      }, 1500);
                    } else {
                      console.log(results.length);

                      callback(results, browser);
                    }
                    limit--;
                  }
                }
              }
              request.continue();
            })
            .catch((error) => {
              if ((error.options.data.error = 'Trottled')) {
                console.log('throttled');
              }
              console.log(error);
              request.abort();
            });
        } catch (e) {
          //ignore
        }
      });

      await page.goto('https://gab.com/' + pagename);
      /*await page.setViewport({
              width: 1200,
              height: 800
          });*/
      let last_length = 0;
      let limit_count = 0;

      interval = setInterval(async function () {
        await self.autoScroll(page);

        if (limit_count >= limit) {
          console.log('done');
          clearInterval(interval);
          await page.close();
          callback(results, browser);
        }
        limit_count++;
      }, 15000 + new Utils().getRandomInt(0, 2000));
    } catch (e) {
      console.log('ERROR');
      console.log(e);
    }
  }
  async autoScroll(page) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 9);
    });
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'gab_user_posts',
        method: function (job, db) {
          let crawler = new GabCrawler();
          let database_name = '';
          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let crawler_path = '';

          crawler.getUserPosts(
            job.properties.identifier,
            job.properties.limit,
            function (posts) {
              console.log(
                'done crawling ' + posts.length + 'posts... add jobs for come'
              );

              fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: posts }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                  console.log('Hello World > helloworld.txt');
                }
              );

              //console.log(objectArrayToCSV({data:posts[0]}));
              //update job
              db.read()
                .get('jobs')
                .find({ id: job.id })
                .assign({ status: 'done' })
                .write();
            }
          );
        },
      },
    ];
  }
};
