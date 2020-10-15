const path = require('path');

module.exports = class Datasource extends Worker {
  getMethods() {
    let self = this;

    return [
      {
        identifier: 'gab_user_posts',
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
        method: function (job, db) {
          let crawler = new GabCrawler();
          let database_name = '';
          if (job.properties.parent == null) database_name = job.id;
          else database_name = job.properties.parent;

          let crawler_path = '';

          crawler.getUserPosts(
            job.properties.identifier,
            job.properties.limit,
            function (posts) {
              console.log(
                'done crawling ' + posts.length + 'posts... add jobs for come'
              );

              fs.writeFile(
                path.resolve(__dirname, '../data/' + job.id + '.json'),
                JSON.stringify({ data: posts }, null, 2),
                function (err) {
                  if (err) return console.log(err);
                  console.log('Hello World > helloworld.txt');
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
