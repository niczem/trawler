/**
 * @file **onions.danwin1210.de** download tor-catalogue from danwin1210.de, and creates screenshots of each website in the result
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--proxy-server=socks5://tor:9050',
      ],
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
  getPageInfo(link) {
    let self = this;
    const https = require('https');

    // At request level
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    return new Promise((resolve, reject) => {
      console.log('get page info', link);
      setTimeout(function () {
        axios
          .get(`https://onionlist.net${link}`, { httpsAgent: agent })
          .then((response) => {
            let $ = cheerio.load(response.data);
            let link = $('#infoList a:first-of-type').attr('href');
            if (!link) {
              link = $('#linkInfos a button').parent().attr('href');
            }
            console.log(link, 'link');
            let good_ratings, bad_ratings, is_online, online_date, description;

            let site_title = $('#siteTitle h1').text();
            //get ratings
            $('#infoList li').each(function (i, e) {
              if (
                $(e).find('strong').text().indexOf('Reviews:') > -1 ||
                $(e).find('b').text().indexOf('Reviews:') > -1
              ) {
                let ratingArray = $(e)
                  .text()
                  .replace('Reviews:', '')
                  .replace('good', '')
                  .replace('bad', '')
                  .split(',');
                good_ratings = parseInt(ratingArray[0]);
                bad_ratings = parseInt(ratingArray[1]);
              }
              if (
                $(e).find('strong').text().indexOf('Description:') > -1 ||
                $(e).find('b').text().indexOf('Description:') > -1
              ) {
                description = $(e).text().replace('Description:', '');
              }
              if (
                $(e).find('strong').text().indexOf('Online:') > -1 ||
                $(e).find('b').text().indexOf('Online:') > -1
              ) {
                if ($(e).text().replace('Online:', '').indexOf('Yes') > -1)
                  is_online = true;
                if ($(e).text().replace('Online:', '').indexOf('No') > -1)
                  is_online = false;
                online_date = $(e)
                  .text()
                  .replace('Online:', '')
                  .replace('Yes', '')
                  .replace('No', '')
                  .replace(/[()]/g, '');
              }
            });

            resolve({
              link: link,
              site_title: site_title,
              description: description,
              good_ratings: good_ratings,
              bad_ratings: bad_ratings,
              is_online: is_online,
              online_date: online_date,
            });
          })
          .catch(function (e) {
            resolve({});
          });
      }, Math.floor(Math.random() * 0));
    });
  }

  async getPages(limit = 3, callback) {
    let self = this;
    let url = `https://onions.danwin1210.de/?format=json`;
    console.log(url);

    const https = require('https');

    // At request level
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const result = await axios.get(url, { httpsAgent: agent });
    console.log(result);
    if (result.data.onions) {
      callback(result.data);
    }
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'onions.danwin1210.de',
        method: async function (job, db, cb) {
          let crawler = new onionlistCrawler();

          let database_name = '';

          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let crawler_path = '';
          console.log(23);
          crawler.getPages(job.properties.limit, async function (result) {
            let download_path = path.resolve(__dirname, '../../data/' + job.id);

            if (!Fs.existsSync(download_path)) {
              Fs.mkdirSync(download_path);
              console.log('created dir ' + download_path);
            }
            console.log(result);
            for (let i in result.onions) {
              console.log(parseFloat(job.properties.limit));
              if (i < parseFloat(job.properties.limit))
                try {
                  console.log(result.onions[i].address);
                  console.log(i + '/' + result.onions.length);
                  await crawler.takeScreenShot(
                    `http://${result.onions[i].address}.onion`,
                    download_path
                  );
                } catch (e) {
                  console.log(e);
                }
              else {
                break;
              }
              console.log('done');
            }

            fs.writeFile(
              path.resolve(__dirname, '../../data/' + job.id + '.json'),
              JSON.stringify({ data: result }, null, 2),
              function (err) {
                if (err) return console.log(err);
              }
            );
            cb();
          });
        },
        cleanup: async function (job, db) {
          let download_path = path.resolve(__dirname, '../../data/' + job.id);
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
