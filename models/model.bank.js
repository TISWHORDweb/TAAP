
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_banks";
// const ModelAdmin = require('./model.business')

class ModelBank extends Model {
}

ModelBank.init({
    bid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    sid: {type: DataTypes.INTEGER},
    bankAccountNumber: {type: DataTypes.STRING},
    bankName: {type: DataTypes.STRING},
    bankCode: {type: DataTypes.STRING},
    accountName: {type: DataTypes.STRING}
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelBank;