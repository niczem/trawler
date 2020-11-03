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

class onionlistCrawler {
  getCategoryLinkList(link, limit = 3, callback, results = []) {
    console.log('asd', limit, link);
    if (limit === 0) return callback(results);

    let self = this;
    axios
      .get(link)
      .then((response) => {
        let $ = cheerio.load(response.data);
        $('#linksList>ul a').each(function (i, e) {
          let link = $(e).attr('href');
          results.push(link);
        });
        console.log(results);
        limit = limit - 1;
        self.getCategoryLinkList(
          `https://onionlist.org/${$('#linksNavbar>a:last-of-type').attr(
            'href'
          )}`,
          limit,
          callback,
          results
        );
      })
      .catch(function (e) {
        console.log(e);

        limit = 0;
        self.getCategoryLinkList(null, limit, callback, results);
      });
  }

  async takeScreenShot(url, path) {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--proxy-server=socks5://127.0.0.1:9050',
      ],
    });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });

      await page.setViewport({ width: 1024, height: 800 });
      await page.screenshot({
        path: path + '/' + url.replace(/[^\w\s]/gi, '') + '.png',
        fullPage: true,
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
          .get(`https://onionlist.org${link}`)
          .then((response) => {
            let $ = cheerio.load(response.data);
            let link = $('#infoList a').attr('href');

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
                bad_ratings = parseInt(ratingArray[0]);
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
    setTimeout(function () {
      self.getCategoryLinkList(
        `https://onionlist.org/cat/${pagename}`,
        limit,
        async function (links) {
          console.log('function done, got links:', links);
          let results = [];
          for (let i in links) {
            let data = await self.getPageInfo(links[i]);
            results.push(data);
          }
          callback(results);
        }
      );
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

              for (let i in posts) {
                console.log(posts[i].link);
                console.log(i + '/' + posts.length);

                try {
                  await crawler.takeScreenShot(
                    posts[i].link.replace('.voto', ''),
                    download_path
                  );
                } catch (e) {
                  console.log(e);
                }
                console.log('done');
              }

              console.log('zip screenshot dir');
              await self.zipDir(download_path, download_path + '.zip', job.id);
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
        },
      },
    ];
  }
};
