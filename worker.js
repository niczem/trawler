const Worker = require('./utils/worker.js');

let worker = new Worker(process.argv[2]);
worker.run();