const path = require('path');
const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));
require('dotenv').config();

let data_dir = process.env.data_dir;

module.exports = class Datasource extends Worker {
  getMethods() {
    let python_directory = '/Users/niczem/projects/GoogleSearchCrawler';
    let self = this;

    return [
      {
        identifier: 'google_dork',

        method: function (job, db) {
          let output_file;
          if (job.properties.filename) output_file = job.properties.filename;
          else
            output_file =
              'google_dork_' +
              job.properties.query
                .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
                .replace(/ /g, '_') +
              new Date().getTime() +
              '.csv';

          //save outputfile in data dir:
          output_file = data_dir + output_file;
          let searchz = '"' + job.properties.query.replace(/"/g, '\\"') + '"';

          let pythonz_directory = '/Users/niczem/projects/GoogleSearchCrawler';
          let commandz = `python ${pythonz_directory}/search_google.py ${searchz} ${path.resolve(
            __dirname,
            output_file
          )}`;
          console.log(commandz);

          require('child_process').exec(commandz, (error, stdout, stderr) => {
            if (error) {
              db.get('jobs')
                .find({ id: job.id })
                .assign({ status: 'error', error: error })
                .write();

              console.error(`exec error: ${error}`);
              return;
            }

            self.addJob({
              type: 'scrape_indexes',
              identifier:
                'scrape_indexes_' +
                job.properties.query
                  .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
                  .replace(/ /g, '_') +
                new Date().getTime(),
              input_file: path.resolve(__dirname, output_file),
              output_file: path.resolve(
                __dirname,
                '../../data/scrape_indexes_' +
                  job.properties.query
                    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
                    .replace(/ /g, '_') +
                  new Date().getTime() +
                  '.csv'
              ),
              parent: job.id,
              continue: true,
            });
            db.get('jobs')
              .find({ id: job.id })
              .assign({ status: 'done' })
              .write();
          });
        },
      },
      {
        identifier: 'scrape_indexes',
        method: function (job, db) {
          let input_file = job.properties.input_file;
          let output_file = job.properties.output_file;

          let command = `python ${python_directory}/scrape_indexes.py ${path.resolve(
            __dirname,
            input_file
          )} ${path.resolve(__dirname, output_file)}`;
          console.log(command);

          require('child_process').exec(command, (error, stdout, stderr) => {
            if (error) {
              if (String(error).includes('no_results')) {
                console.log('No Results.. job done');

                db.get('jobs')
                  .find({ id: job.id })
                  .assign({ status: 'done' })
                  .write();
                console.log(error.Error);
              } else {
                db.get('jobs')
                  .find({ id: job.id })
                  .assign({ status: 'error', error: error })
                  .write();

                console.error(`exec error: ${error}`);
              }
              return;
            }

            console.log('done');
            db.get('jobs')
              .find({ id: job.id })
              .assign({ status: 'done' })
              .write();

            self.addJob({
              type: 'download_files',
              identifier: 'download_files_' + new Date().getTime(),
              input_file: output_file,
              output_dir: path.resolve(
                __dirname,
                data_dir + new Date().getTime()
              ),
              parent: job.id,
              continue: true,
            });
          });
        },
      },
      {
        identifier: 'download_files',
        method: function (job, db) {
          let input_file = job.properties.input_file;
          let output_dir = job.properties.output_dir;

          let command = `python ${python_directory}/download_files.py ${path.resolve(
            __dirname,
            input_file
          )} ${path.resolve(__dirname, output_dir)}`;

          self.runShellCommand(command, job.id, function (error, result) {
            if (error) {
              db.get('jobs')
                .find({ id: job.id })
                .assign({ status: 'error', error: error })
                .write();

              console.log(job.properties);
              console.error(`exec error: ${error}`);
              return;
            }

            db.get('jobs')
              .find({ id: job.id })
              .assign({ status: 'done' })
              .write();

            console.log('done :)');
          });
        },
      },
    ];
  }
};
