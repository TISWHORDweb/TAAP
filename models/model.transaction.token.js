const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_trx_token";
const queryInterface = sequelize.getQueryInterface()

// const ModelAdmin = require('./model.school')

class ModelTrxToken extends Model {
}

ModelTrxToken.init({
    ttid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    sid: {type: DataTypes.INTEGER, allowNull: false},
    tid: {type: DataTypes.INTEGER, allowNull: false},
    trxToken: {type: DataTypes.STRING, allowNull: false},
    isUsed: {type: DataTypes.BOOLEAN, defaultValue: false},
    transactionID: {type: DataTypes.STRING, allowNull: true},
    status: {type: DataTypes.STRING, defaultValue: "pending"}
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */
// queryInterface.addColumn(tableName, 'transactionID', {
//     type: DataTypes.STRING
// })
sequelize.sync();
module.exports = ModelTrxToken;