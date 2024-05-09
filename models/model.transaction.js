/**
 * Slantapp code and properties {www.slantapp.io}
 */
/**
 * Model for businessand admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_transactions";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelTransactions extends Model {
}

ModelTransactions.init({
    tid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    pid: {type: DataTypes.INTEGER},
    sid: {type: DataTypes.INTEGER},
    Date: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    transactionID: {type: DataTypes.STRING},
    amount: {type: DataTypes.STRING},
    serviceType: {type: DataTypes.STRING},
    status: {type: DataTypes.STRING},
    fullName: {type: DataTypes.STRING},
    accountNumber: {type: DataTypes.STRING},
    bankName: {type: DataTypes.STRING},
    type: {type: DataTypes.STRING},
    flwid: {type: DataTypes.STRING},
    customer: {type: DataTypes.STRING},
    narration: {type: DataTypes.STRING},
    reference: {type: DataTypes.STRING},
    statusType: {type: DataTypes.STRING},
    debitAmount: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    country: {type: DataTypes.STRING},
    creditAmount: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    issue: {type: DataTypes.INTEGER, defaultValue: 0}
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelTransactions;
