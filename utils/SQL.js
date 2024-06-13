module.exports = class SQL {
	constructor(db_name){
		const { Sequelize } = require('sequelize');
		this.sequelize= new Sequelize({
		  dialect: 'sqlite',
		  storage: __dirname + '/../data/'+db_name+'.sqlite'
		});
		this.Post = require(__dirname + "/../models/Post");
		this.Comment = require(__dirname + "/../models/Comment");
		this.Reaction = require(__dirname + "/../models/Reaction");
		this.Dataset = require(__dirname + "/../models/Dataset");

		this.sequelize.sync();
	}
}