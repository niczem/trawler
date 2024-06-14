const { DataTypes } = require("sequelize");

module.exports = {
    post_id: DataTypes.STRING,
    date: DataTypes.STRING,
    comments_link: DataTypes.STRING,
    text_short: DataTypes.STRING
};