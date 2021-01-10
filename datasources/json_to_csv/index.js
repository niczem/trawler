/**
 * @file **url** generic http scraper
 */

const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs');

const converter = require('json-2-csv');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'json_to_csv',
        method: function (job, db, final_cb) {
          let run = async function (json_file, cb) {
            console.log('convert file now', job);
            let rawdata = fs.readFileSync(
              path.resolve(__dirname, '../../data/' + json_file)
            );
            let json_data = JSON.parse(rawdata);
            console.log(json_data);

            converter.json2csv(
              json_data.data,
              (err, csv) => {
                fs.writeFile(
                  path.resolve(__dirname, '../../data/' + job.id + '.csv'),
                  csv,
                  function (err) {
                    if (err) return console.log(err);
                    cb();
                  }
                );
              },
              {}
            );
          };
          run(job.properties.input_files.json, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log('converting done...');
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
              .assign({
                output_files: {
                  csv: job.id + '.csv',
                },
              })
              .write();

            final_cb();
          });
        },
      },
    ];
  }
};
