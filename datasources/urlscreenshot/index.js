/**
 * @file *urlscreenshotter* scrapes comma separated list of urls and creates screenshot of each of them
 */
const path = require('path');

const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

require('dotenv').config();

let data_dir = process.env.data_dir;

const fs = require('fs').promises;
const Fs = require('fs');

const puppeteer = require('puppeteer-extra');
const rimraf = require('rimraf');

const cheerio = require('cheerio'),
  axios = require('axios');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class onionlistCrawler {
  async takeScreenShot(url, path) {
    const browser = await puppeteer.launch({
      headless: true,
      //executablePath: 'google-chrome-stable',
      ignoreHTTPSErrors: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      await page.setViewport({ width: 1280, height: 768 });
      await page.screenshot({
        path: path + '/' + url.replace(/[^\w\s]/gi, '') + '.jpeg',
        fullPage: true,
        type: 'jpeg',
        captureBeyondViewport: false,
      });
    } catch (e) {
      console.log('error', e);
    }
    await browser.close();
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'urlscreenshot',
        method: async function (job, db) {
          let crawler = new onionlistCrawler();

          let database_name = '';

          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let crawler_path = '';
          console.log(23);

          let urls = job.properties.urls.split(',');
          console.log(urls);

          let download_path = path.resolve(__dirname, '../../data/' + job.id);

          if (!Fs.existsSync(download_path)) {
            Fs.mkdirSync(download_path);
            console.log('created dir ' + download_path);
          }

          for (let i in urls) {
            let url = urls[i];
            url = url.slice(0, -1);
            console.log(url);
            console.log(i + '/' + urls.length);

            try {
              await crawler.takeScreenShot(`http://${url}`, download_path);
            } catch (e) {
              console.log(e);
            }
            console.log('done');
          }

          let gif_move_and_compress =
            'convert -gravity North -extent 1600x1600 -background white -delay 150 -loop 0 ' +
            download_path +
            '/*.png ' +
            download_path +
            '/animation.gif&&mogrify -format jpg ' +
            download_path +
            '/*.png&&rm -f ' +
            download_path +
            '/*.png&&mv ' +
            download_path +
            '/animation.gif ' +
            download_path +
            '/../' +
            job.id +
            '.gif';

          let create_mp4_file_from_screenshots = `mogrify -crop 1280  ${download_path}/*.jpeg -gravity Center && convert -append ${download_path}/*.jpeg ${download_path}/out.png && ffmpeg -f lavfi -i color=s=1920x1080 -loop 1 -t 0.08 -i ${download_path}/out.png -filter_complex "[1:v]scale=1920:-2,setpts=if(eq(N\,0)\,0\,1+1/0.02/TB),fps=25[fg]; [0:v][fg]overlay=y=-'t*h*0.02':eof_action=endall[v]" -map "[v]" ${download_path}/output.mp4`;
          console.log('create gif');
          self.runShellCommand(
            create_mp4_file_from_screenshots,
            job.id,
            async function () {
              console.log('zip screenshot dir');
              await self.zipDir(download_path, download_path + '.zip', job.id);
              console.log('zipping done..');

              console.log('delete directory...');
              rimraf.sync(download_path);

              //convert -resize 1024x1024 -delay 1 -loop 0 *.png animation.gif

              fs.writeFile(
                path.resolve(__dirname, '../../data/' + job.id + '.json'),
                JSON.stringify({ data: result }, null, 2),
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
            }
          );
        },
      },
    ];
  }
};
