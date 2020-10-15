module.exports = class SQL {
	constructor(db_name){
		const { Sequelize, Model, DataTypes } = require('sequelize');
		this.sequelize = new Sequelize({
		  dialect: 'sqlite',
		  storage: __dirname + '/../data/'+db_name+'.sqlite'
		});

		this.Post = this.sequelize.import(__dirname + "/../models/Post");
		this.Comment = this.sequelize.import(__dirname + "/../models/Comment");
		this.Reaction = this.sequelize.import(__dirname + "/../models/Reaction");
		this.Dataset = this.sequelize.import(__dirname + "/../models/Dataset");

		this.sequelize.sync();
	}
}