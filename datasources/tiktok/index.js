const path = require('path');
const Fs = require('fs');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));
const ffmpeg = require('ffmpeg');
axios = require('axios');

require('dotenv').config();

const fs = require('fs').promises;

function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

class tiktokCrawler extends Worker {
  async downloadVideo(url, i) {
    const writer = Fs.createWriteStream(
      path.resolve(__dirname, '../data', `${i}.mp4`)
    );

    return axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        connection: 'keep-alive',
        referer: 'https://www.tiktok.com/foryou?lang=en',
        origin: 'https://www.tiktok.com',
        accept: '*/*',
        authority: 'm.tiktok.com',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-dest': 'video',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
        Range: 'bytes=0-',
      },
    }).then((response) => {
      //ensure that the user can call `then()` only when the file has
      //been downloaded entirely.

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error = null;
        writer.on('error', (err) => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            resolve(true);
          }
          //no need to call the reject here, as it will have been called in the
          //'error' stream;
        });
      });
    });
  }
  getVideoFrames(videopath) {
    return new Promise((resolve, reject) => {
      if (!Fs.existsSync(videopath)) {
        Fs.mkdirSync(videopath);
        console.log('created dir ' + videopath);
      }

      var process = new ffmpeg(videopath + '.mp4');
      process.then(
        function (video) {
          video.fnExtractFrameToJPG(
            videopath,
            {
              //@To Do: find out fps for ticktock
              every_n_frames: 90,
            },
            () => {
              resolve();
            }
          );
        },
        function (err) {
          reject('Error: ' + err);
        }
      );
    });
  }
  async ocr(file) {
    return new Promise((resolve, reject) => {
      let cmd = 'easyocr -l en -f ' + file + ' --detail=1 --gpu=False';
      var exec = require('child_process').exec;
      var child = exec(cmd);
      child.stdout.on('data', function (data) {
        self.addToLog(job_id, data);
      });
      child.stderr.on('data', function (data) {
        self.addToLog(job_id, data, 'error');
      });

      child.on('close', function (code) {
        resolve(code);
        //Here you can get the exit code of the script
        console.log('closing code: ' + code);
      });
    });
  }
  async getVideosForTag(tag, limit = 3, callback) {
    //might be interesting to look at:
    //appId=1233&region=NL&appType=m&isAndroid=false&isMobile=false&isIOS=false&OS=mac

    let options = {
      headers: {
        origin: 'https://www.tiktok.com',
        accept: 'application/json, text/plain, */*',
        authority: 'm.tiktok.com',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        referer: 'https://www.tiktok.com/tag/lol',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      },
    };
    let url =
      'https://m.tiktok.com/share/item/list?aid=1988&app_name=tiktok_web&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-GB&browser_platform=MacIntel&browser_name=Mozilla&browser_online=true&ac=4g&timezone_name=Europe%2FAmsterdam&appId=1233&region=NL&appType=m&isAndroid=false&isMobile=false&isIOS=false&OS=mac&id=1745&type=3&count=30&minCursor=0&maxCursor=0&shareUid=&recType=&lang=';

    let results = [];

    console.log(limit);
    for (let cc = limit; cc > 0; cc--) {
      console.log(cc);
      let result = await this.http('get', url, options);
      results = results.concat(result.data.body.itemListData);
    }

    return results;
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'tiktok_video_tag',
        fields: [
          {
            name: 'identifier',
            title: 'identifier',
            type: 'text',
          },
          {
            name: 'limit',
            title: 'Limit',
            type: 'number',
            step: 1,
          },
          {
            name: 'continue',
            title: 'Continue crawl with children(reactions, posts)',
            type: 'select',
            options: {
              true: 'yes',
              false: 'no',
            },
          },
        ],
        method: async function (job, db) {
          let crawler = new tiktokCrawler();

          let database_name = '';

          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let posts = await crawler.getVideosForTag(
            job.properties.identifier,
            job.properties.limit
          );

          console.log('done crawling item list, download videos...');
          let download_path = path.resolve(__dirname, '../data/' + job.id);

          if (!Fs.existsSync(download_path)) {
            Fs.mkdirSync(download_path);
            console.log('created dir ' + download_path);
          }

          for (let i in posts) {
            console.log(`video ${i}`);
            if (posts[i].itemInfos.video.urls[0]) {
              await crawler.downloadVideo(
                posts[i].itemInfos.video.urls[0],
                download_path + '/' + posts[i].itemInfos.id
              );
              await crawler.getVideoFrames(
                download_path + '/' + posts[i].itemInfos.id
              );

              console.log('analyze videoframes:');
              let filenames = Fs.readdirSync(
                download_path + '/' + posts[i].itemInfos.id
              );

              let lastresult;

              posts[i].frame_ocr_texts = [];

              for (let n in filenames) {
                console.log(n + '/' + filenames.length);
                let file =
                  download_path +
                  '/' +
                  posts[i].itemInfos.id +
                  '/' +
                  filenames[n];

                let log = await execShellCommand(
                  'easyocr -l en -f ' + file + ' --detail=0 --gpu=False'
                );

                //console.log(log);
                if (log != lastresult) {
                  posts[i].frame_ocr_texts.push(log);
                  console.log(log);
                }

                lastresult = log;
              }
            }
          }
          fs.writeFile(
            path.resolve(__dirname, '../data/' + job.id + '.json'),
            JSON.stringify({ data: posts }, null, 2),
            function (err) {
              if (err) return console.log(err);
            }
          );
          //console.log(objectArrayToCSV({data:posts[0]}));
          //update job
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
