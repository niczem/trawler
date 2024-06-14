const { DataTypes } = require("sequelize");

module.exports = {
    post_id: DataTypes.STRING,
    date:DataTypes.STRING,
    reactions:DataTypes.STRING,
    username:DataTypes.STRING,
    userid:DataTypes.STRING,
};