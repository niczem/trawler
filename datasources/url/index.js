/**
 * @file **url** generic http scraper
 */

const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs').promises,
  axios = require('axios');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;
    return [
      {
        identifier: 'url',
        method: function (job, db, final_cb) {
          let run = async function (url, cb) {
            let results = [];
            let i = job.properties.pagination_min || 1;
            let pagination_max = parseInt(job.properties.pagination_max) || 1;
            let result_length = 0;
            let headers = {};
            if (job.properties.authorization_header) {
              headers = {
                Authorization: job.properties.authorization_header,
              };
            }
            while (i <= pagination_max) {
              let step = i;
              if(job.properties.increase_by){
                step = i*parseInt(job.properties.increase_by)
              }
              url = job.properties.url.replace('%%%page%%%',step);

              let response;
              try {
                console.log(url);
                response = await axios.get(url, { headers });
              } catch (e) {
                console.log('error fetching url');
              }
              //@sec this feels terribly wrong
              let data_obj;
              try{
              if (job.properties.result_index)
                eval('data_obj = response.data.' + job.properties.result_index);
              else data_obj = response.data;
              }catch(e){
                console.log("error adding response to results with result_index:;",e)
              }

              console.log('continue with page ', i);

              if (job.properties.result_is_array == 'yes')
                results = results.concat(data_obj);
              else results.push(data_obj);

              console.log(results.length);
              if (results.length > result_length) {
                console.log('number of results increased, continue crawling');
              } else {
                console.log('results do not increase anymore, stop crawling');
                //cancel loop if number didn't increase
                i = job.properties.pagination_max;
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

            //tid
            console.log(result[0].length)
            if(result[0].length == 1)
              result = result[0];

              fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: result }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                }
              );
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
