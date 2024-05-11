
/**
 * Model for program
 */
const sequelize = require('../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_program";
/**
 * Model extending sequelize model class
 */
class ModelProgram extends Model {
}

ModelProgram.init({
    prid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    sid: {type: DataTypes.INTEGER},
    name: {type: DataTypes.STRING, allowNull: false},
    amount: {
        type: DataTypes.DECIMAL(20, 2), defaultValue: 0.00
    },
    deadline: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: true},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();
module.exports = ModelProgram;