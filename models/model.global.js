
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_global";
// const ModelAdmin = require('./model.business')

class ModelGlobal extends Model {
}

ModelGlobal.init({
    gid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    disableAllUsers: {type: DataTypes.BOOLEAN, defaultValue: false},
    by: {type: DataTypes.STRING},
    disableAllTransfer: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelGlobal;