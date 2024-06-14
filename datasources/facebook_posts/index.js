/**
 * @file **facebook posts and reactions** scrape facebook posts, comments and reactions (like, heart, etc)
 */
const path = require('path');
const Worker = require(path.resolve(__dirname, '../../utils/worker.js'));

const SQL = require(path.resolve(__dirname, '../../utils/SQL.js'));
require('dotenv').config();

let data_dir = process.env.data_dir;

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const timeout = 7000;
const run_headless = process.env.run_headless;

const cookie_file = './data/_sessiondata/cookies.json'
let browser;

class Utils {
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  createBrowserInstance(){
    console.log('create browser instance');
    return puppeteer.launch({
      defaultViewport: null,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
}

class FacebookCrawler {
  async getPosts(pagename, limit = 3, callback) {
    try {
      console.log(`limit: ${limit}`);
      if (browser == null)
        browser = await new Utils().createBrowserInstance();
      const page = await browser.newPage();
      const cookiesString = await fs.readFile(cookie_file);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);

      await page.goto('https://m.facebook.com/' + pagename);
      /*await page.setViewport({
              width: 1200,
              height: 800
          });*/
      let last_length = 0;
      let limit_count = 0;

      await this.autoScroll(page);
      let self = this;

      //check if user is logged in
      let check_auth = await this.checkAuth(page);
      //check auth also logs in but returns false if user was not logged in before
      if (!check_auth) {
        await page.close();
        //call function again
        return this.getPosts(pagename, limit, callback);
      }

      let not_increased = 0;

      let interval = setInterval(async function () {
        let items = await page.evaluate(() => {
          let results = [];
          let items = document.querySelectorAll('article');

          items.forEach(async function (item) {
            let json_info = item.getAttribute('data-store');

            let date = item.querySelector('a abbr').innerText;

            let comments_link = [];
            ///story.php?story_fbid=2605697059517975&id=450493125038390&fs=0&focus_composer=0
            //story_fbid=2436078379813178&id=450493125038390&__tn__=%2AW-R.replace('__tn__=%2AW-R','')+'&fs=0&focus_composer=0';

            let comments_links = item.querySelectorAll('footer a[href]');
            console.log('comments_links');

            comments_link =
              comments_links['0']
                .getAttribute('href')
                .replace('__tn__=%2AW-R', '') + '&fs=0&focus_composer=0';
            console.log(comments_link, comments_links);
            /*comments_links.forEach((item) => {
                              comments_link = item.getAttribute('href').replace('__tn__=%2AW-R','')+'&fs=0&focus_composer=0';
                          });*/
            let text_short;
            if (item.querySelector('.story_body_container span>p') != null)
              text_short = item.querySelector('.story_body_container span>p')
                .innerText;

            //get user

            //get type

            results.push({
              date: date,
              comments_link: comments_link,
              text_short: text_short,
              json_info: json_info,
              //html:item.innerHTML
            });
          });
          return results;
        });

        if (items.length > last_length) {
          not_increased = 0; //reset not increased counter
          console.log('amount of items increased (found new entries)');
        } else {
          not_increased++;
        }

        await self.autoScroll(page);
        console.log(`autoscroll finished ${limit_count}/${limit}`);

        if (
          limit_count >= limit ||
          not_increased >= 3 //exit if amount does not increase after 3 intervals
        ) {
          console.log('done');
          clearInterval(interval);

          //add db etries
          //Post.bulkCreate(items);

          await page.close();
          callback(items, browser);
        }

        limit_count++;
      }, 1000 + new Utils().getRandomInt(0, 2000));
    } catch (e) {
      console.log('ERROR');
      console.log(e);
    }
  }
  async run() {
    try {
      const cookiesString = await fs.readFile(cookie_file);
    } catch (e) {
      console.log(e);
      if (e.errno == -2) {
        console.log('.... wait for login');
        await login();
        console.log('..done');
      }
    }

    let self = this;

    this.getPosts('sometest', 1, async function (items) {
      console.log(items);
      console.log('starting to crawl comments...');
      for (let i in items) {
        let post_id = items[i].comments_link
          .split('?')[1]
          .split('&')[0]
          .replace('story_fbid=', '');
        //console.log(post_id);
        if (i == 0 || i == 1)
          await self.getComments(
            'https://m.facebook.com' + items[i].comments_link
          );
      }
    });
  }

  async getComments(post_id, link, limit = 3, callback) {
    const comment_url = link;
    if (browser == null)
      browser = await new Utils().createBrowserInstance();
    const page = await browser.newPage();
    const cookiesString = await fs.readFile(cookie_file);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto(comment_url);

    let self = this;

    let last_length = 0;
    let limit_count = 0;
    let interval = setInterval(async function () {
      let items = await page.evaluate(function () {
        let results = [];
        let items = document.querySelectorAll('div[data-sigil="comment"]');
        items.forEach(function (item) {
          let date = item.querySelector(
            'div[data-sigil="ufi-inline-comment-actions"] abbr'
          ).innerText;

          let reactions;
          if (item.querySelector('._14va'))
            reactions = item.querySelector('._14va').innerText;

          let username = item.querySelector('._2b05').innerText;

          let userid = item
            .querySelector('._2a_j')
            .getAttribute('data-sigil')
            .replace('feed_story_ring', '');
          /*let comments_link;
                      let comments_links = item.querySelectorAll('header a[href]');
                      comments_links.forEach((item) => {
                          comments_link = item.getAttribute('href');
                      });
                      let text_short;*/
          if (item.querySelector('div[data-sigil="comment-body"]') != null)
            text_short = item.querySelector('div[data-sigil="comment-body"]')
              .innerText;

          //page.click('.async_elem');
          //console.log('clicked =) ');

          results.push({
            date: date,
            //comments_link:comments_link,
            text_short: text_short,
            reactions: reactions,
            username: username,
            userid: userid,
            //html:item.innerHTML
          });
        });

        //if no "load more" butto is available, run interval one more time and exit
        if (document.querySelector('._108_'))
          document.querySelector('._108_').click();

        return results;
      });

      for (let i in items) {
        items[i].post_id = post_id;
      }

      /*if(items.length>last_length){
              console.log('wouhuhuu increased');
          }*/

      await self.autoScroll(page);
      console.log('autoscroll finished', limit_count);

      if (limit_count >= limit) {
        console.log('done');

        clearInterval(interval);
        await page.close();
        if (typeof callback == 'function') callback(items, browser);
      }

      limit_count++;
    }, 7000);
  }

  async checkAuth(page) {
    let self = this;
    let result = await page.evaluate(async function () {
      if (document.querySelector('a[aria-label="Log in"]')) {
        return false;
      }
      return true;
    });

    console.log('login');

    console.log(result);
    if (!result) {
      await this.login();
      return false;
    }
    return true;
  }

  async getPostReactions(post_id, limit = 10, callback) {
    let link =
      'https://m.facebook.com/ufi/reaction/profile/browser/?ft_ent_identifier=' +
      post_id;

    console.log(link);

    if (browser == null)
      browser = await new Utils().createBrowserInstance();
    const page = await browser.newPage();
    const cookiesString = await fs.readFile(cookie_file);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto(link);

    let self = this;

    let last_length = 0;
    let limit_count = 0;

    let interval = setInterval(async function () {
      let items = await page.evaluate(function () {
        let results = [];
        let items = document.querySelectorAll('._1uja');

        items.forEach(function (item) {
          let username = item.querySelector('._4mo').innerText;

          let href = item.querySelector('.ib.cc._1aj4 a').getAttribute('href');

          let reaction_type = 'like';
          if (item.querySelector('.sx_fcc398')) reaction_type = 'love';
          if (item.querySelector('.sx_9750dd')) reaction_type = 'angry';
          if (item.querySelector('.sx_144a02')) reaction_type = 'sad';
          if (item.querySelector('.sx_634783')) reaction_type = 'haha';
          if (item.querySelector('.sx_dca9b7')) reaction_type = 'wow';

          /*let comments_link;
                      let comments_links = item.querySelectorAll('header a[href]');
                      comments_links.forEach((item) => {
                          comments_link = item.getAttribute('href');
                      });
                      let text_short;
                      if(item.querySelector('div[data-sigil="comment-body"]') != null)
                          text_short =  item.querySelector('div[data-sigil="comment-body"]').innerText;
                      

                      //page.click('.async_elem');
                      //console.log('clicked =) ');
  */

          results.push({
            profile_link: href,
            username: username,
            reaction_type: reaction_type,
          });
        });

        //if no "load more" butto is available, run interval one more time and exit
        if (document.querySelector('.touchable.primary'))
          document.querySelector('.touchable.primary').click();

        return results;
      });

      for (let i in items) {
        items[i].post_id = post_id;
        console.log(items.length);
      }

      /*if(items.length>last_length){
              console.log('wouhuhuu increased');
          }*/

      await self.autoScroll(page);
      console.log('autoscroll finished', limit_count);

      if (limit_count >= limit) {
        console.log('done');

        clearInterval(interval);
        await page.close();
        if (typeof callback == 'function') callback(items, browser);
      }

      limit_count++;
    }, 7000);
  }
  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        let max_scrolls = 3;
        let i = 0;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          //resolve if page bottom is reached
          //or max_scrolls is reached (in case of ajax never ending pages)
          if (totalHeight >= scrollHeight || i >= max_scrolls) {
            clearInterval(timer);
            resolve();
          }
          i++;
        }, 100);
      });
    });
  }

  async login() {
    const username = process.env.facebook_username;
    const password = process.env.facebook_password;

    const browser = await new Utils().createBrowserInstance();
    const page = await browser.newPage();

    await page.goto('https://m.facebook.com/');
    await page.click('div[aria-label="Allow all cookies"]');
    await page.focus('input[aria-label="Email address or phone number"]');
    await page.keyboard.type(username);
    await page.focus('input[aria-label="Password"]');
    await page.keyboard.type(password);
    await page.keyboard.press('Enter');

    //press enter
    console.log('logged in, now waiting 20s');
    //long timeout is needed because fb is slow af
    await new Promise(r => setTimeout(r, 20000));
    return setTimeout(async function () {
      try {
        const cookies = await page.cookies();
        console.log("WRITING COOKIES", cookies);
        await fs.writeFile(cookie_file, JSON.stringify(cookies, null, 2));
        browser.close();
      } catch (e) {
        console.log('1');
        console.log(e);
      }
    }, 10000);
  }
}

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'facebook_posts',
        method: function (job, db) {
          let crawler = new FacebookCrawler();
          let database_name = '';
          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          const sql = new SQL(database_name);
          let crawler_path = '';

          crawler.getPosts(
            job.properties.identifier,
            job.properties.limit,
            function (posts) {
              console.log('done crawling posts... add jobs for comments');
              console.log(posts);
              console.log(sql.Post)
              sql.Post.bulkCreate(posts);
              if (job.properties.continue)
                for (let i in posts) {
                  //add job for new post
                  let post_id = posts[i].comments_link
                    .split('?')[1]
                    .split('&')[0]
                    .replace('story_fbid=', '');

                  console.log(post_id);
                  self.addJob({
                    type: 'comments',
                    identifier: posts[i].comments_link,
                    post_id: post_id,
                    parent: job.id,
                    limit: 3,
                    continue: true,
                  });

                  self.addJob({
                    type: 'reactions',
                    identifier: post_id,
                    parent: job.id,
                    limit: 10,
                    continue: true,
                  });
                }

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
      {
        identifier: 'comments',
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
            name: 'engine_working',
            title: 'Continue crawl with children(reactions, posts)',
            type: 'select',
            options: {
              true: 'yes',
              false: 'no',
            },
          },
        ],
        method: function (job, db) {
          let crawler = new FacebookCrawler();
          let database_name = '';
          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          const sql = new SQL(database_name);
          crawler.getComments(
            job.properties.post_id,
            'https://m.facebook.com' + job.properties.identifier,
            job.properties.limit,
            function (comments) {
              console.log('done crawling comments...');
              sql.Comment.bulkCreate(comments);
              //update job
              db.get('jobs')
                .find({ id: job.id })
                .assign({ status: 'done' })
                .write();
            }
          );
        },
      },

      {
        identifier: 'reactions',
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
            name: 'engine_working',
            title: 'Continue crawl with children(reactions, posts)',
            type: 'select',
            options: {
              true: 'yes',
              false: 'no',
            },
          },
        ],
        method: function (job, db) {
          let crawler = new FacebookCrawler();
          let database_name = '';
          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          const sql = new SQL(database_name);
          crawler.getPostReactions(
            job.properties.identifier,
            job.properties.limit,
            function (reactions) {
              console.log('done crawling reactions');
              sql.Reaction.bulkCreate(reactions);
              //update job
              db.get('jobs')
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
