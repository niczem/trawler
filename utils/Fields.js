require('dotenv').config();
module.exports = class Fields {
    constructor() {
      let datasources = {}
      console.log(process.env.VUE_APP_datasources);
      let field_definitions = JSON.parse(process.env.VUE_APP_datasources);
      for(let i in field_definitions){
        //load worker field definitions
        let Datasource = require(`../datasources/${field_definitions[i]}/fields.js`);
        //loop through worker methods
        for(let n in Datasource){
          datasources[Datasource[n].identifier] = Datasource[n];
        }
      }
      this.fields = datasources;
    }
}