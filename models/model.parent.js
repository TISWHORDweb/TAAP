
/**
 * Model for parent
 */
const sequelize = require('../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_parent";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelParent extends Model {
}

ModelParent.init({
    pid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    firstName: {type: DataTypes.STRING, allowNull: false},
    lastName: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.STRING, allowNull: true},
    country: {type: DataTypes.STRING, allowNull: true},
    balance: {
        type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00
    },
    balanceUpdatedAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    code: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},
    apiKey: {type: DataTypes.STRING, allowNull: true, unique: true},
    token: {type: DataTypes.STRING, allowNull: true, unique: true},
    lastLogin: {type: DataTypes.STRING, allowNull: true, unique: true},
    whoIs: {type: DataTypes.INTEGER, defaultValue: 0},
    pin: {type: DataTypes.STRING},
    transferBlock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    blocked: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'transferBlock', {
//     type: DataTypes.STRING
// });

// queryInterface.removeColumn('taap_parent', 'cardId');

sequelize.sync();
module.exports = ModelParent;