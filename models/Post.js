module.exports = (sequelize, DataTypes) => {
  return sequelize.define('post', {
    post_id: DataTypes.STRING,
    date: DataTypes.STRING,
    comments_link: DataTypes.STRING,
    text_short: DataTypes.STRING
  });
};