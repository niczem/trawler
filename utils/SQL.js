
module.exports = class SQL {
	constructor(db_name){
		const { Sequelize, DataTypes } = require('sequelize');
		this.sequelize= new Sequelize({
		  dialect: 'sqlite',
		  storage: __dirname + '/../data/'+db_name+'.sqlite'
		});
		this.Post = this.sequelize.define('post',require('./../models/Post'));
		this.Comment = this.sequelize.define('comment', {
			post_id: DataTypes.STRING,
			date:DataTypes.STRING,
			reactions:DataTypes.STRING,
			username:DataTypes.STRING,
			userid:DataTypes.STRING,
		  });
		this.Reaction = this.sequelize.define('reaction', {
			post_id: DataTypes.STRING,
			profile_link: DataTypes.STRING,
			username: DataTypes.STRING,
			reaction_type: DataTypes.STRING
		  });
		this.Dataset = this.sequelize.define('dataset', {
			dataset_id: DataTypes.STRING,
			type:DataTypes.STRING,
			author:DataTypes.STRING,
			comment:DataTypes.STRING
		  })

		this.sequelize.sync();
	}
}