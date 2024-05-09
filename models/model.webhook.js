const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const tableName = "taap_webhooks";

// const ModelAdmin = require('./model.business')
function isJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

class ModelWebhook extends Model {
}

ModelWebhook.init({
    weid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    response: {
        type: DataTypes.JSON,
        defaultValue:{},
        get() {
            const rawValue = this.getDataValue('response');
             if (isJson(rawValue)) {
                return rawValue ? JSON.parse(rawValue) : null;
            } else {
                return rawValue ? rawValue : null;
            }
        },
        set(value) {
            const stringValue = value ? value : null;
            this.setDataValue('response', stringValue);
        }
    },
}, {sequelize, tableName});

/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelWebhook;