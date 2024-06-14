
exports.ModelParent = require('./model.parent');
exports.ModelSchool = require('./model.school');
exports.ModelAdmin = require('./model.admin');
exports.ModelTransactions = require('./model.transaction');
exports.ModelWebhook = require('./model.webhook');
exports.ModelProgram = require('./model.program');
exports.ModelBank = require('./model.bank');
exports.ModelTrx = require('./model.trx');
exports.ModelTrxToken = require('./model.transaction.token');
exports.ModelGlobal = require('./model.global');

/**
 * Run belonging and relationship before sync()
 */
require('./model.transaction').belongsTo(require("./model.school"), {
    as: 'School',
    foreignKey: {name: 'sid', allowNull: null}
});

require('./model.transaction').belongsTo(require("./model.parent"), {
    as: 'Parent',
    foreignKey: {name: 'pid', allowNull: null}
});