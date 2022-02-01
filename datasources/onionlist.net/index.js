/**
 * @file **onionlist** download tor-catalogue from onionlist.o
 *
 * convert \( *.jpg -resize 192x +append \) \( -clone 0 -crop 192x+0+0 -set delay 100 \) \( -clone 0 -crop 192x+48+0 -set delay 25 \) \( -clone 0 -crop 192x+96+0 \) \( -clone 0 -crop 192x+144+0 \) \( -clone 0 -crop 192x+192+0 -set delay 100 \) \( -clone 0 -crop 192x+240+0 -set delay 25 \) \( -clone 0 -crop 192x+288+0 \) \( -clone 0 -crop 192x+336+0 \) -delete 0 -loop 10 +repage test.gif
 */
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class onionlistCrawler {
  getCategoryLinkList(link, limit = 3, callback, results = []) {
    console.log('asd', limit, link);
    if (limit === 0) return callback(results);

    let self = this;
    axios
      .get(link)
      .then((response) => {
        let $ = cheerio.load(response.data);
        console.log(23);
        $('#linksList>ul a').each(function (i, e) {
          let link = $(e).attr('href');
          console.log(link.replace('../..', ''));
          results.push(link.replace('../..', '').replace('/../', '/'));
        });
        console.log(443);
        console.log(results);
        limit = limit - 1;
        let url2 = `https://onionlist.net/cat/${
          this.category_number
        }/${capitalizeFirstLetter(this.category_title)}/${$(
          '#linksNavbar>a:last-of-type'
        )
          .attr('href')
          .replace(capitalizeFirstLetter(this.category_title) + '/', '')}`;
        console.log('url2', url2);
        self.getCategoryLinkList(url2, limit, callback, results);
      })
      .catch(function (e) {
        console.log(e);

        limit = 0;
        self.getCategoryLinkList(null, limit, callback, results);
      });
  }

  async takeScreenShot(url, path) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--proxy-server=socks5://127.0.0.1:9050',
      ],
    });
    const page = await browser.newPage();
    try {
      url = url.replace('.onion.ws', '.onion');
      url = url.replace('https://', 'http://');
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
    return new Promise((resolve, reject) => {
      console.log('get page info', link);
      setTimeout(function () {
        axios
          .get(`https://onionlist.net${link}`)
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

  async getPagesForCategory(pagename, limit = 3, callback) {
    let self = this;

    if (!this.pagename) {
      this.pagename = pagename;
      this.category_number = this.pagename.split('/')[0];
      this.category_title = this.pagename.split('/')[1];
    }

    let url = `https://onionlist.net/cat/${capitalizeFirstLetter(
      pagename
    )}.html`;
    console.log(url);
    setTimeout(function () {
      self.getCategoryLinkList(url, limit, async function (links) {
        console.log('function done, got links:', links);
        let results = [];
        for (let i in links) {
          let data = await self.getPageInfo(links[i]);
          results.push(data);
        }
        callback(results);
      });
    }, 2000);
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'onionlist_pages',
        method: function (job, db) {
          let crawler = new onionlistCrawler();

          let database_name = '';

          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let crawler_path = '';

          crawler.getPagesForCategory(
            job.properties.category,
            job.properties.limit,
            async function (posts) {
              let download_path = path.resolve(
                __dirname,
                '../../data/' + job.id
              );

              if (!Fs.existsSync(download_path)) {
                Fs.mkdirSync(download_path);
                console.log('created dir ' + download_path);
              }
              console.log(posts);
              for (let i in posts) {
                console.log(posts[i].link);
                console.log(i + '/' + posts.length);

                try {
                  await crawler.takeScreenShot(posts[i].link, download_path);
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
              let create_mp4_file_from_screenshots = `mogrify -crop 1280  ${download_path}/*.jpeg -gravity Center && convert -append ${download_path}/*.jpeg ${download_path}/out.png && ffmpeg -loop 1 -i ${download_path}/out.png  -vf "scroll=vertical=0.0002,crop=iw:600:0:0,format=yuv420p" -t 120 ${download_path}/output.mp4`;
              console.log('create gif');
              self.runShellCommand(
                create_mp4_file_from_screenshots,
                job.id,
                async function () {
                  console.log('zip screenshot dir');
                  await self.zipDir(
                    download_path,
                    download_path + '.zip',
                    job.id
                  );
                  console.log('zipping done..');

                  console.log('delete directory...');
                  rimraf.sync(download_path);

                  //convert -resize 1024x1024 -delay 1 -loop 0 *.png animation.gif

                  fs.writeFile(
                    path.resolve(__dirname, '../../data/' + job.id + '.json'),
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
                }
              );
            }
          );
        },
      },
    ];
  }
};
