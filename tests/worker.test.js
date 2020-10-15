const Worker = require('../utils/worker');
const FileSync = require('lowdb/adapters/FileSync')
const low = require('lowdb')

function initDB(){
    const adapter = new FileSync('../tests/test.json');
    const db = low(adapter)
    // Set some defaults (required if your JSON file is empty)
    db.defaults({ jobs: [], user: {}, count: 0 })
      .write()
    return db;
}



test('test worker.addJob() and getJobs()', async () => {
    let worker = new Worker('test',{
        db_path:'../tests/test.json'
    });
    await worker.addJob(
        {
            identifier:'test1',
            type:'test',
        });
    await worker.addJob(
        {
            identifier:'test2',
            type:'test2',
        });
    jobs = await worker.getJobs();
    try{
        worker.destroyDB();
    }catch(e){
        console.log(e);
    }
    expect(jobs.length).toBe(2);
});

test('test logging', async () => {
    let worker = new Worker('test',{
        db_path:'../tests/test.json'
    });
    let job = await worker.addJob(
        {
            identifier:'test1',
            type:'test',
        });

    worker.addToLog(job.id, 'this is a test log', 'log');

    jobObj = await worker.getJob(job.id);

    try{
        worker.destroyDB();
    }catch(e){
        console.log(e);
    }
    expect(jobObj.log[0].value).toBe('this is a test log');
});

test('test loading datasources', async () => {
    let worker = new Worker('test',{
        db_path:'../tests/test.json'
    });

    let datasources = worker.loadDatasources();

    try{
        worker.destroyDB();
    }catch(e){
        console.log(e);
    }
    expect(datasources.length).toBe(5);
});
