/**
 * @file **url** generic http scraper
 */

const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs').promises;
const Fs = require('fs');

const puppeteer = require('puppeteer');
const rimraf = require('rimraf');

const cheerio = require('cheerio'),
  axios = require('axios');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;
    return [
      {
        identifier: 'url',
        method: function (job, db) {
          let run = async function (url, cb) {
            let results = [];
            let i = job.properties.pagination_min || 0;
            let pagination_max = parseInt(job.properties.pagination_max) || 1;
            let result_length = 0;
            let headers = {};
            if (job.properties.authorization_header) {
              headers = {
                Authorization: job.properties.authorization_header,
              };
            }
            while (i <= pagination_max) {
              url = job.properties.url.replace('%%%page%%%', i);

              let response;
              try {
                response = await axios.get(url, { headers });
              } catch (e) {
                console.log('error fetching url');
              }
              //@sec this feels terribly wrong
              let data_obj;
              if (job.properties.result_index)
                eval('data_obj = response.data.' + job.properties.result_index);
              else data_obj = response.data;

              console.log('page ', i);

              if (job.properties.result_is_array == 'true')
                results = results.concat(data_obj);
              else results.push(data_obj);

              console.log(results.length);
              if (results.length > result_length) {
                console.log('wouhuhu number of results increased');
              } else {
                //cancel loop if number didn't increase
                job.properties.pagination_max = i;
              }
              result_length = results.length;
              i++;
            }
            console.log('done with pagination');
            cb(null, results);
          };
          run(job.properties.url, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: result }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                }
              );
            }
          });

          db.read()
            .get('jobs')
            .find({ id: job.id })
            .assign({ output_file: job.id + '.json' })
            .assign({ status: 'done' })
            .write();
        },
      },
    ];
  }
};
