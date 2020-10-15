module.exports = (sequelize, DataTypes) => {
  return sequelize.define('dataset', {
    dataset_id: DataTypes.STRING,
    type:DataTypes.STRING,
    author:DataTypes.STRING,
    comment:DataTypes.STRING
  });
};