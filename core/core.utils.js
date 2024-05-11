const { ModelParent, ModelSchool, ModelAdmin, ModelTransactions, ModelTrx } = require("../models");
const CryptoJS = require("crypto-js");
const crypto = require('crypto');
const sequelize = require("../database/index");
const {Op} = require("sequelize");


class CoreError extends Error {
    constructor(msg, code) {
        super(msg);
        this.statusCode = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.CoreError = CoreError;
//json parser function
exports.JParser = (m, s, d) => ({ message: m, status: s, data: d });
//ascii code generator
exports.AsciiCodes = function generateChar(length) {
    //populate and store ascii codes
    let charArray = [];
    let code = [];
    for (let i = 33; i <= 126; i++) charArray.push(String.fromCharCode(i));
    //do range random here
    for (let i = 0; i <= length; i++) {
        code.push(charArray[Math.floor(Math.random() * charArray.length - 1)]);
    }
    return code.join("");
}

exports.checkMail = async (email) => {
    const check = { where: { email: email } }
    const admin = await ModelAdmin.findOne(check)
    const parent = await ModelParent.findOne(check)
    const school = await ModelSchool.findOne(check)

    let data

    if (parent) {
        data = parent
    } else if (admin) {
        data = admin
    } else if (school) {
        data = school
    }

    return data;
}

exports.generatePassword = (length) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}

//****** Generate Transaction Ref Numbers *******//
exports.generateTransactionId = (length) => {
    let transactionId = '';

    for (let i = 0; i < length; i++) {
        const randomDigit = Math.floor(Math.random() * 10);
        transactionId += randomDigit;
    }

    return transactionId;
}

exports.DepositCharge = async (pid, transId, amount, transaction) => {
    const charge = await calculateCharge(amount);
    const rans = this.generateTransactionId(13);
    // transId = this.generateTransactionId(8);
    const user = await ModelParent.findOne({ where: { pid } })
    const oldBalance = +user.balance
    const newBalance = oldBalance - charge;
    const fullName = user.firstName + " " + user.lastName
    const chargeTransaction = {
        amount: charge,
        serviceType: "Deposit Fee",
        pid,
        narration: "Stamp Duty on Electronic Funds Transfer - " + transId,
        statusType: "Debit",
        status: "Successful",
        transactionID: transId,
        debitAmount: charge,
        fullName,
        bankName: "Taap",
        reference: `TAAP_NGN_${rans}`,
        balance: newBalance,
    };
    const mainTrxCharge = {
        pid,
        narration: "Stamp Duty on Electronic Funds Transfer - " + transId,
        debitAmount: charge,
        fullName,
        bankName: "Taap",
        reference: `TAAP_NGN_${rans}`,
        transactionID: transId,
        serviceType: "Deposit Fee",
        amount: charge,
        prevBalance: oldBalance,
        newBalance,
        status: "Successful",
        statusType: "Debit",
    };

    try {
        if (charge > 0) {
            await ModelTransactions.findOrCreate({
                where: { transactionID: transId, amount: charge },
                defaults: chargeTransaction,
                transaction
            });
            await ModelTrx.create(mainTrxCharge, { transaction });
            await user.decrement("balance", { by: charge, transaction })
        }
        return { charge, chgBalance: newBalance };
    } catch (error) {
        await transaction.rollback();
        console.error("Error in Charge:", error);
        throw new Error("Failed to process transaction charge");
    }
};

const calculateCharge = (amount) => {
    if (amount >= 100 && amount <= 1000) {
        return (amount * 0.03).toFixed(2);
    } else if (amount > 1000 && amount <= 3000) {
        return 35;
    } else if (amount > 3000 && amount <= 5000) {
        return 50;
    } else if (amount > 5000 && amount <= 10000) {
        return 75;
    } else if (amount > 10000 && amount <= 20000) {
        return 100;
    } else if (amount > 20000 && amount <= 50000) {
        return 100;
    } else if (amount > 50000) {
        return 150;
    }
};

exports.GetCharge = (amount) => {
    if (amount >= 100 && amount <= 1000) {
        return parseFloat((amount * 0.03).toFixed(2));
    } else if (amount > 1000 && amount <= 3000) {
        return 35;
    } else if (amount > 3000 && amount <= 5000) {
        return 50;
    } else if (amount > 5000 && amount <= 10000) {
        return 75;
    } else if (amount > 10000 && amount <= 20000) {
        return 100;
    } else if (amount > 20000 && amount <= 50000) {
        return 100;
    } else if (amount > 50000) {
        return 150;
    }
}

exports.paginated = async (model, req, option = {}, trx = false) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;


    let results = await model.findAndCountAll({
        ...option,
        limit,
        offset,
        order: [
            ['createdAt', 'DESC']
        ],
    });
    if (trx) {
        results.rows = this.sortedData(results.rows)
    }

    const totalPages = Math.ceil(results.count / limit);

    return {
        page,
        limit,
        total: results.count,
        totalPages,
        data: results.rows,
    };
};

exports.generateTrxToken = () => {
    let trxSerial = sha1(new Date())

    // Encryption key
    const encryptionKey = 'xrTrgM07';

    return crypto.createHash('sha256')
        .update(trxSerial + encryptionKey)
        .digest('hex');
}

exports.Charges = (amount) => {
    if (amount < 50000) {
        return 0
    } else if (amount >= 50000) {
        return 0
    }
}

exports.DecryptPin = (pin) => {
    const bytes = CryptoJS.AES.decrypt(pin, process.env.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

exports.GlobalDisable = async () => {
    const gid = process.env.GLOBAL_ID
    const globalOption = {
        where: {gid}
    }

    const globe = await ModelGlobal.findOne(globalOption)

    if (globe) {
        return globe.disableAllTransfer
    }
}

exports.CurrentDate = () => {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

exports.TrxTimeChecker = async (sid) => {
    //******* Get Transaction belonging to school and do balance check *******//
    let school = await ModelSchool.findOne({ where: { sid } })
    const lastThreeTrx = await ModelTrx.findAll({
        where: { sid, status: 'Successful' },
        order: [['createdAt', 'DESC']],
        limit: 5
    });

    //************ Block school with bot-like transaction ******************//
    const lastTrx = lastThreeTrx[0]
    const curDate = new Date()
    let timeDiff = curDate - lastTrx.createdAt;

    let trxTrials = school.trxTrials + 1
    if (timeDiff < 60000 * 0.5) {
        await school.update({
            trxTrials
        });
        if (school.trxTrials >= 3) {
            await school.update({
                blocked: true,
                transferBlock: true,
            });
            return {
                timeStatus: true,
                timeMsg: 'Request Failed - Multiple duplicate retries detected. If continued might block your account. If this is a security breach kindly change your password or send email to support@taap.com, Account is blocked at this stage.'
            }
        }
        return { timeStatus: true, timeMsg: 'Duplicate Transfer - You have a recent transaction with the same amount and account number.' }
    }
    return { timeStatus: false, timeMsg: "" }

    //************ Block school with bot-like transaction ******************//
}

exports.RowCheck = async (sid, res) => {

    //******* Get Transaction belonging to school and do balance check *******//
    let school = await ModelSchool.findOne({where: {sid}})
    const lastThreeTrx = await ModelTrx.findAll({
        where: {sid, status: 'Successful'},
        order: [['txid', 'DESC']],
        limit: 5
    });

    const balanceAuditPassed = lastThreeTrx.every((trx, index) => {
        if (index > 0) {
            const previousTrx = lastThreeTrx[index - 1];
            return trx.newBalance === previousTrx.prevBalance;
        }
        return true;
    });


    //******* Get Transaction belonging to school and do balance check *******//

    const userBalance = school.walletBalance
    const auditBalance = lastThreeTrx[0]?.newBalance ? lastThreeTrx[0]?.newBalance : 0
    if (balanceAuditPassed) {
        return {auditBalance, audit: userBalance === auditBalance};
    }

    return {auditBalance, audit: false};
}

exports.fraudulentTrx = async (sid, tranId, amount, withCharges, newBalance) => {
    const details = {
        "transactionID": tranId,
        "serviceType": "Transfer",
        "amount": amount,
        "status": "failed",
        "bankName": "Mongoro",
        "sid": sid,
        issue: 2,
        "debitAmount": withCharges,
        "balance": newBalance,
        narration: "Transaction audit failed, please contact support!"
    }
    let [transaction, created] = await ModelTransactions.findOrCreate({
        where: {transactionID: tranId, status: "failed", sid},
        defaults: details
    })

    return {transaction, debited: created};
}

exports.Charge = async (sid, transId, amount, fullName, oldBalance) => {
    const charge = calculateCharge(amount);
    const rans = this.generateTransactionId(13);
    const newBalance = +oldBalance - charge;

    const chargeTransaction = {
        amount: charge,
        serviceType: "Transfer Fee",
        sid,
        narration: "Stamp Duty on Electronic Funds Transfer - " + transId,
        statusType: "Debit",
        status: "Successful",
        transactionID: transId,
        debitAmount: charge,
        fullName,
        bankName: "Mongoro",
        reference: `TAAP_NGN_${rans}`,
        balance: newBalance,
    };
    const mainTrxCharge = {
        sid,
        narration: "Stamp Duty on Electronic Funds Transfer - " + transId,
        debitAmount: charge,
        fullName,
        bankName: "Mongoro",
        reference: `TAAP_NGN_${rans}`,
        transactionID: transId,
        serviceType: "Transfer Fee",
        amount: charge,
        prevBalance: oldBalance,
        newBalance,
        status: "Successful",
        statusType: "Debit",
    };

    try {
        await ModelTransactions.findOrCreate({
            where: {transactionID: transId, amount: charge},
            defaults: chargeTransaction
        });
        await ModelTrx.create(mainTrxCharge);

        return charge;
    } catch (error) {
        console.error("Error in Charge:", error);
        throw new Error("Failed to process transaction charge");
    }
};

exports.DebitAccount = async (sid, data, tranId, amount, withCharges, newBalance, narration, oldBalance) => {

    //** Start Transaction **//
    const t = await sequelize.transaction();
    //** Start Transaction **//
    //** Get business **//
    const options = {where: {sid}}
    const school = await ModelSchool.findOne(options)
    //** Get business **//

    const charge = await this.Charge(sid, tranId, amount, data.full_name, oldBalance);
    const chargedBalance = +oldBalance - charge;

    const details = {
        "flwid": data.id,
        "transactionID": tranId,
        "serviceType": "Transfer",
        "amount": amount,
        "status": "pending",
        "fullName": data.full_name,
        "accountNumber": data.account_number,
        "bankName": data.bank_name,
        "sid": sid,
        issue: 2,
        "reference": data.reference,
        "debitAmount": withCharges,
        "balance": chargedBalance,
        narration
    }


    try {
        let [transaction, created] = await ModelTransactions.findOrCreate({
            where: {transactionID: tranId, flwid: data.id, status: "pending"},
            defaults: details,
            transaction: t
        })
        // newBalance = +newBalance - charge
        const debitAmount = +charge + +amount

        const newUserBalance = {balanceUpdatedAt: Date.now()}
        if (created) {
            await school.decrement('balance', {by: debitAmount, transaction: t})
            await school.update(newUserBalance, {transaction: t})
        }
        await t.commit();
        return {transaction, debited: created};
    } catch (e) {
        await t.rollback();
        throw new Error("Failed to process account debit");
    }
}

exports.RefundAccount = async (sid, oldBalance, amount) => {

    const school = await ModelSchool.findOne({where: {sid}})
    const details = {
        "transactionID": await this.generateTransactionId(8),
        "serviceType": "Refund",
        "amount": amount,
        "status": "successful",
        "fullName": school.name,
        "bankName": "Taap",
        "bid": bid,
        issue: 2,
        "debitAmount": amount,
        "balance": oldBalance,
        narration: "Refund for failed transaction"
    }

    let [transaction, created] = await ModelTransactions.findOrCreate({
        where: {transactionID: details.transactionID, status: "refund"},
        defaults: details
    })

    const refundData = {walletBalance: oldBalance, walletUpdatedAt: Date.now()}
    await school.update(refundData)

    return {transaction, created}
}