/**
 * @file **url** generic http scraper
 */

const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs'),
  axios = require('axios');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;
    return [
      {
        identifier: 'motiondetection',
        method: function (job, db, final_cb) {
          let run = async function (url, cb) {
            console.log('done with pagination');

            const results_file = path.resolve(
              __dirname,
              '../../data/' + job.id + '.json'
            );

            const results_dir = path.resolve(__dirname, '../../data/' + job.id);
            if (!fs.existsSync(results_dir)) {
              console.log('create dir for result images');
              fs.mkdirSync(results_dir);
            }

            const arrayOfFiles = job.properties.path.split(',');

            console.log(arrayOfFiles);

            for (let i in arrayOfFiles) {
              console.log('======', arrayOfFiles[i], '======');

              self.addJob({
                type: 'motiondetection_videofile',
                identifier: arrayOfFiles[i],
                path: arrayOfFiles[i],
                parent: job.id,
                filename: arrayOfFiles[i],
                results_dir: results_dir,
                results_file: results_file,
              });
            }
            cb(null, []);
          };
          run(job.properties.url, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              /*fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: result }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                }
              );*/
            }

            db.read()
              .get('jobs')
              .find({ id: job.id })
              .assign({ status: 'done' })
              .assign({ output_files: { json: job.id + '.json' } })
              .write();

            final_cb();
          });
        },
      },
      {
        identifier: 'motiondetection_videofile',
        method: function (job, db, final_cb) {
          let run = async function (url, cb) {
            console.log('starting to analyse video');

            const shell = require('shelljs');

            console.log(job.properties.path);
            console.log(job.properties.filename);
            console.log(job.properties.results_file);
            console.log(job.properties.results_dir);

            const script_path = path.resolve(
              __dirname,
              './video-analyzer-toolkit/main.py'
            );

            let command = `python3 ${script_path} -v "${job.properties.path}" -u ${job.properties.results_dir} -i -j ${job.properties.results_file}`;
            console.log(command);

            await self.runShellCommand(command, job.id, (res) => {
              console.log('done');

              cb(null, []);
            });
          };
          run(job.properties.url, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              /*fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: result }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                }
              );*/
            }

            db.read()
              .get('jobs')
              .find({ id: job.id })
              .assign({ status: 'done' })
              .assign({ output_files: { json: job.id + '.json' } })
              .write();

            final_cb();
          });
        },
      },
    ];
  }
};
