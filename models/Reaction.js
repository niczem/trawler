const { DataTypes } = require("sequelize");

module.exports = {
    post_id: DataTypes.STRING,
    profile_link: DataTypes.STRING,
    username: DataTypes.STRING,
    reaction_type: DataTypes.STRING
};