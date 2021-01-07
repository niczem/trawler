const express = require('express');
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const app = express()// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());


app.use(cors())

const port = 3000;

/*

const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + '/data/db.sqlite'
});*/

// respond with "hello world" when a GET request is made to the homepage

app.get('/', function (req, res) {
  	sequelize.query("SELECT profile_link,COUNT(*) as count FROM reactions GROUP BY profile_link ORDER BY count DESC").then(([results, metadata]) => {
  		res.send(results);
	})
});

app.post('/jobs', function(req, res){
    console.log(req.body);

    if(req.body.type == 'facebook_posts'){
    	req.body.type = 'facebook_posts';
    	req.body.plattform = 'facebook';
	}
	
    if(req.body.type == 'google_dork'){
    	req.body.plattform = 'google';
    }
	console.log(req.body);
	
	

	const low = require('lowdb')
	const FileSync = require('lowdb/adapters/FileSync')
	const adapter = new FileSync('data/db.json')
	const db = low(adapter)
	
	if(!req.body.continue)
	req.body.continue = false;

	let time = new Date().getTime();

	if(!req.body.properties.identifier)
		req.body.properties.identifier = req.body.properties.query
	if(!req.body.properties.identifier)
		req.body.properties.identifier = req.body.properties.category.replace('/','-');


	if(!req.body.properties.continue_with_job)
		req.body.properties.continue_with_job = false;

	const job = {
	  "id": `${time}_${req.body.type}_${req.body.properties.identifier}`,
	  "status": "quoed",
	  "log":[],
	  "history": [
		{
		  "timestamp": time,
		  "status": "quoed"
		}
	  ],
	  "crawler_id": "RALFPH",
	  "timestamp": time,
	  "properties": req.body.properties
	};
	console.log(job);

	db.get('jobs')
	.push(job)
	.write();

	res.send({'ok':job});

});

//clear jobs
app.get('/jobs', function (req, res) {
			const low = require('lowdb')
			const FileSync = require('lowdb/adapters/FileSync')
			const adapter = new FileSync('data/db.json')
			const db = low(adapter)
	  		res.send(db.get('jobs').sortBy('timestamp').value());

});
app.get('/jobs/clear/all', function (req, res) {

	

});



app.get('/datasets', function (req, res) {
	const startPath = 'data/';
	const filter = 'csv';
    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }
    let results = [];
    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        /*if (stat.isDirectory()){
            fromDir(filename,filter); //recurse
        }*/
        if (filename != 'data/db.json') {
            console.log('-- found: ',filename);
            results.push(filename.replace(startPath,''));
        };
    };
	res.send({data:results});	
});




app.get('/downloaddataset/:id', function (req, res) {
	let file = `${__dirname}/data/${req.params.id}`;
	res.download(file);
});

app.get('/datasets/:id', function (req, res) {
	switch(req.params.id.split('.')[req.params.id.split('.').length-1]){
		case 'csv':
			// require csvtojson
			var csv = require("csvtojson");

			// Convert a csv file with csvtojson
			csv()
			.fromFile(`./data/${req.params.id}`)
			.then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
				res.send({data:{csv:jsonArrayObj}});
			})
			break;
		case 'json':
			// require csvtojson
			let data = require(`./data/${req.params.id}`);
	
			// Convert a csv file with csvtojson
			res.send({data:data});
			break;
		case 'sqlite':
			const SqliteToJson = require('sqlite-to-json');
			const sqlite3 = require('sqlite3');
			const exporter = new SqliteToJson({
				//@dangerzone!
			  client: new sqlite3.Database(`./data/${req.params.id}`)
			});
		
			exporter.all(function (err, all) {
				res.send({data:all});
			});
			break;
		case 'zip':
			let files = [];
			const StreamZip = require('node-stream-zip');
			const zip = new StreamZip({
				file: `./data/${req.params.id}`,
				storeEntries: true
			});
			// Handle errors
			zip.on('error', err => { /*...*/ });
		
			zip.on('ready', () => {
				console.log('Entries read: ' + zip.entriesCount);
				for (const entry of Object.values(zip.entries())) {
					const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
					console.log(`Entry ${entry.name}: ${desc}`);
					files.push([entry.name]);
				}

				res.send({data:{
					files:files
				}});
					// Do not forget to close the file once you're done
				zip.close()
			});
			break;
	}
	
});

app.delete('/datasets/:filename', function (req, res) {
	const file = `${__dirname}/data/${req.params.filename}`;
	try {
		fs.unlinkSync(file)
		res.send('delete '+req.params.filename);
		//file removed
	} catch(err) {
		console.error(err)
	}
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))


