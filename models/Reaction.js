module.exports = (sequelize, DataTypes) => {
  return sequelize.define('reaction', {
    post_id: DataTypes.STRING,
    profile_link: DataTypes.STRING,
    username: DataTypes.STRING,
    reaction_type: DataTypes.STRING
  });
};