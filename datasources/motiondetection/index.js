/**
 * @file **url** generic http scraper
 */

const path = require('path');
const getDimensions = require('get-video-dimensions');
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

            let crop = false;
            if(job.properties.areas.length > 0){
              crop = {
                areas:job.properties.areas,
                totalwidth:job.properties.totalwidth,
                totalheight:job.properties.totalheight,
              }
            }

            for (let i in arrayOfFiles) {
              self.addJob({
                type: 'motiondetection_videofile',
                identifier: arrayOfFiles[i],
                path: arrayOfFiles[i],
                parent: job.id,
                filename: arrayOfFiles[i],
                results_dir: results_dir,
                results_file: results_file,
                crop:crop
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

            let h_ratio,v_ratio;

            if(job.properties.crop){
              const dimensions = await getDimensions(job.properties.path);
              h_ratio = dimensions.width/job.properties.crop.totalwidth;
              v_ratio = dimensions.height/job.properties.crop.totalheight;
              let area = job.properties.crop.areas[0]
              let cropped_path = job.properties.path.replace(/(\.[\w\d_-]+)$/i, '_cropped$1');;

              let command = `ffmpeg -i ${job.properties.path} -filter:v "crop=${area.width*h_ratio}:${area.height*v_ratio}:${area.x*h_ratio}:${area.y*v_ratio}" ${cropped_path}`
              await self.runShellCommand(command, job.id);
              job.properties.path = cropped_path;
            }

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
