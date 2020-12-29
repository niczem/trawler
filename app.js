const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const url = require('url')


require('./api.js')
global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')

const Worker = require('./utils/worker.js');
let worker = new Worker(process.argv[2]);
worker.run();

let init_url
if (process.env.NODE_ENV === 'DEV') {
  init_url = 'http://localhost:8080/'
} else {
  init_url = `file://${process.cwd()}/dist/index.html`
}

app.on('ready', () => {
  let window = new BrowserWindow({width: 800, height: 600})
  window.loadURL(init_url)
})

