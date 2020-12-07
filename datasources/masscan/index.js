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

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'masscan',
        method: function (job, db) {
          console.log(
            `docker run ilyaglow/masscan -p${job.properties.ports} ${job.properties.ips} `
          );
          const filename = path.resolve(
            __dirname,
            '../../data/' + job.id + '.list'
          );
          Fs.writeFileSync(filename);

          self.runShellCommand(
            `docker run ilyaglow/masscan -p${job.properties.ports} ${job.properties.ips} > ${filename}`,
            job.id,
            (res) => {
              console.log(res);
            }
          );
          console.log(job);

          db.read()
            .get('jobs')
            .find({ id: job.id })
            .assign({ status: 'done' })
            .write();
        },
      },
    ];
  }
};
