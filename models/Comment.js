module.exports = (sequelize, DataTypes) => {
  return sequelize.define('comment', {
    post_id: DataTypes.STRING,
    date:DataTypes.STRING,
    reactions:DataTypes.STRING,
    username:DataTypes.STRING,
    userid:DataTypes.STRING,
  });
};