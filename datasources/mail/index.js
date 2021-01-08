/**
 * @file **mail** sends mails and files - mostly usefull in pipelines
 */

const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'mail',
        method: function (job, db,final_cb) {
          let run = async function (json_file, cb) {
            console.log(job);
            let attachments=[];
            for(let i in job.properties.input_files){
              console.log(i,job.properties.input_files[i])
              attachments.push({
                content:fs.readFileSync(path.resolve(__dirname, '../../data/' + job.properties.input_files[i])),
                filename:job.properties.input_files[i]
              })
            }
            var nodemailer = require('nodemailer');
            // create reusable transporter object using the default SMTP transport
            console.log(process.env.nodemailer_smtp);
            var transporter = nodemailer.createTransport(process.env.nodemailer_smtp);
            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: process.env.nodemailer_from, // sender address
                to: job.properties.to, // list of receivers
                subject: job.properties.subject, // Subject line
                text: job.properties.content, // plaintext body
                attachments:attachments
            };
            
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
                cb(error,info)
            });

          };
          run(job.properties.input_files.json, function (err, result) {
            if (err) {
              console.log(err);
              db.read()
                .get('jobs')
                .find({ id: job.id })
                .assign({ status: 'error' })
                .write();
            } else {
              console.log('job done...');
              db.read()
                .get('jobs')
                .find({ id: job.id })
                .assign({ status: 'done' })
                .write();
                final_cb();
            }
          });

        },
      },
    ];
  }
};
