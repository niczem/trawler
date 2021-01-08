const low = require('lowdb')
const path = require('path')
const FileSync = require('lowdb/adapters/FileSync')
const fs = require('fs')

const SQL = require('./SQL.js');

const axios = require('axios');
require('dotenv').config();



module.exports = class Worker {
    constructor(crawler_id,config={db_path:'../data/db.json'}) {
        this.jobs_running = [];
        this.max_jobs = 1;
        this.crawler_id = crawler_id;
        this.config = config;
        this.config.db_path = path.resolve(__dirname,this.config.db_path);
        const adapter = new FileSync( this.config.db_path);
        this.db = low(adapter);

        this.db.defaults({ jobs: [], user: {}, count: 0 })
        .write();

    }
    destroyDB(){
      fs.unlinkSync(this.config.db_path);
    }
    //@cmd command to be run
    //@cb cb(err,result) function to be executed
    runShellCommand(cmd,job_id,cb){
      let  self  =  this;
      console.log('RUN COMMAND:',cmd);
      var exec = require('child_process').exec;
      var child = exec(cmd);
      
      child.stdout.on('data', function(data) {
        self.addToLog(job_id,data);
      });
      child.stderr.on('data', function(data) {
          self.addToLog(job_id,data,'error');
      });

      child.on('close', function(code) {
        cb(code);
        //Here you can get the exit code of the script
        console.log('closing code: ' + code);
      });
      
    }
    //loads datasources
    loadDatasources(){
      let config = {
        datasources:JSON.parse(process.env.datasources)
      }
      let datasources = []
      for(let i in config.datasources){
        let Datasource = require(`../datasources/${config.datasources[i]}/index.js`);
        let datasource = new Datasource();
        datasources.push(new Datasource().getMethods());
      }
      return datasources;
    }
    addToLog(job_id,value,type='log') {
      let job = this.db.get('jobs')
      .find({ id: job_id });

      let jobObj = job.value();
      
      if(typeof jobObj == 'undefined')
        throw `no job with id ${job_id} found`;

      jobObj.log.push({
        "type":type,
        "timestamp": new Date().getTime(),
        "value": value
      });

      job.assign(jobObj)
      .write();

    }

    async http(method, url, options){

      if(method === 'get'){
        let result = await axios.get(url,options);
        return result;
      }else
        throw 'unknown request type'
    }

    async zipDir(inputpath, outputpath,job_id){
      return new Promise((resolve,reject)=>{
        this.runShellCommand(`zip -r ${outputpath} ${inputpath} -j`,job_id,function(){
          resolve()
        })
      })
    }

    async addJob(properties,status='quoed',time = new Date().getTime()) {
        let job = {
          id: `${time}_${properties.type}_${properties.identifier}`,
          status:status,
          history:[{timestamp:time,status:status}],
          log:[],
          crawler_id:this.crawler_id,
          timestamp:time,
          properties};
          
        this.db.get('jobs')
          .push(job)
          .write();

        return  job;
    }

    async getJob(id) {
      this.db.read();  
      try{
          return this.db.get('jobs').find({ id: id }).value();
      }catch(e){
          throw e;
      }   
  }
  async getJobs(status) {
      this.db.read();  
      try{
          if(status)
              return this.db.get('jobs').filter({status: status}).value();
          return this.db.get('jobs').sortBy('timestamp').value();
      }catch(e){
          return [];
      }   
  }


  async scheduleJobs(){

    let jobs = await this.getJobs('scheduled');
    for(let i in jobs){
      //if job timestamp <= current time => quoe job
      if(jobs[i].timestamp <= new Date().getTime())
        this.db.get('jobs')
        .find({ id: jobs[i].id })
        .assign({ status: 'quoed'})
        .write()
      
    }
    
  }

    async runJob(job){
        console.log('run job:');
        //set job status to running
        this.db.get('jobs')
          .find({ id: job.id })
          .assign({ status: 'running'})
          .write()
        //add new job if job is scheduled
        if(job.properties.schedule){
          let newjob = job;
          console.log(newjob);
          let timestamp = new Date().getTime();
          switch(job.properties.schedule.interval){
            case 'hourly':
              timestamp = timestamp+3600000;
            break;
            case 'daily':
              timestamp = timestamp+86400000;
              break;
            case 'weekly':
              timestamp = timestamp+604800000;
              break;
            case 'monthly':
              timestamp = timestamp+2419200000;
              break;
          }

          this.addJob(newjob.properties,'scheduled',timestamp);
        }

        let database_name = '';
        if(job.properties.parent == null)
            database_name = job.id;
        else
            database_name = job.properties.parent;

        let datasources = this.loadDatasources();

        let self = this;
        //loop through loaded datasources
        for(let i in datasources){
          //loop through datasource methods
          for(let n in datasources[i]){
            console.log(datasources[i][n].identifier,job.properties.type);

            //run method if it matches the method in the identifier
            if(datasources[i][n].identifier === job.properties.type){

              datasources[i][n].method(job,this.db,async function(){
                //callback after function ends.
                //NEEDS TO BE IMPLEMENTED IN JOB METHOD!!!
                if(job.properties.continue_with_job){

                  //get job obj again after output files have been added
                  job = await self.getJob(job.id);
                  console.log('got job 2nd time',job);
                  job.properties.continue_with_job.parent=job.id
                  job.properties.continue_with_job.input_files=job.output_files;
                  job.properties.continue_with_job
                  self.addJob(job.properties.continue_with_job,'quoed');
                }
                
              });
            }

          }
        }

    }

    async run(){
      
        let self = this;
        let tick = async function(){

            self.scheduleJobs();

            let jobs = await self.getJobs('quoed');
            if(jobs.length > 0 && self.jobs_running.length === 0){
                self.runJob(jobs[0]);
            }
        }
        tick();
        setInterval(function(){

            tick();
        },10000)
    }
}