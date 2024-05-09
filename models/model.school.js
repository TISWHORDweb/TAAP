
/**
 * Model for school
 */
const sequelize = require('../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_school";
/**
 * Model extending sequelize model class
 */
class ModelSchool extends Model {
}

ModelSchool.init({
    sid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.STRING, allowNull: true},
    country: {type: DataTypes.STRING, allowNull: true},
    balance: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},
    code: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},
    apiKey: {type: DataTypes.STRING, allowNull: true, unique: true},
    token: {type: DataTypes.STRING, allowNull: true, unique: true},
    lastLogin: {type: DataTypes.STRING, allowNull: true, unique: true},
    whoIs: {type: DataTypes.INTEGER, defaultValue: 1},
    blocked: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();
module.exports = ModelSchool;