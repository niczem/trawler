const { DataTypes } = require("sequelize");

module.exports = {
    dataset_id: DataTypes.STRING,
    type:DataTypes.STRING,
    author:DataTypes.STRING,
    comment:DataTypes.STRING
};