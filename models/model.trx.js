/**
 * Slantapp code and properties {www.slantapp.io}
 */
/**
 * Model for parent and schools
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_trx";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelTrx extends Model {
}

ModelTrx.init({
    txid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    sid: {type: DataTypes.INTEGER},
    tid: {type: DataTypes.INTEGER},
    pid: {type: DataTypes.INTEGER},
    transactionID: {type: DataTypes.STRING},
    amount: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    prevBalance: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    newBalance: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    serviceType: {type: DataTypes.STRING},
    fullName: {type: DataTypes.STRING},
    accountNumber: {type: DataTypes.STRING},
    bankName: {type: DataTypes.STRING},
    type: {type: DataTypes.STRING},
    flwid: {type: DataTypes.STRING},
    customer: {type: DataTypes.STRING},
    narration: {type: DataTypes.STRING},
    reference: {type: DataTypes.STRING},
    statusType: {type: DataTypes.ENUM('Debit', 'Credit')},
    debitAmount: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    creditAmount: {type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00},
    country: {type: DataTypes.STRING},
    issue: {type: DataTypes.INTEGER, defaultValue: 0},
    status: {
        type: DataTypes.ENUM(
            'Successful', 'Failed', 'Pending', 'Refund',
            'Processing', 'Invalid', 'Cancelled', 'Declined')
    }
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelTrx;
