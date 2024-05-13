const { FlwTrxCron } = require("../core/core.cron");
const { paginated, generateTransactionId, generateTrxToken, Charges, DecryptPin, GlobalDisable, CurrentDate, fraudulentTrx, RowCheck, TrxTimeChecker2, RowCheck2 } = require("../core/core.utils");
const { ModelTransactions, ModelSchool, ModelTrxToken, ModelParent } = require("../models");
const { useAsync, utils, errorHandle, } = require('./../core');
const cron = require('node-cron');
const Flutterwave = require('flutterwave-node-v3');
// const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Parent Insight
exports.parentInsight = useAsync(async (req, res) => {
    try {
        let pid = req.pid

        const lastDeposit = await ModelTransactions.findOne({
            where: {
                pid,
                serviceType: 'Deposit',
                status: 'successful'
            },
            order: [['createdAt', 'DESC']]
        })

        res.json(utils.JParser("ok-response", true, lastDeposit));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//School Insight
exports.schoolInsight = useAsync(async (req, res) => {
    try {
        let sid = req.sid

        const lastWithdrawal = await ModelTransactions.findOne({
            where: {
                sid,
                serviceType: 'Transfer',
                status: 'successful'
            },
            order: [['createdAt', 'DESC']]
        })

        res.json(utils.JParser("ok-response", true, lastWithdrawal));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//All bank transfer for admin
exports.allTransfer = useAsync(async (req, res) => {
    try {
        let transaction = await paginated(ModelTransactions, req, {
            include: [
                {
                    model: ModelSchool, as: 'School', order: [
                        ['createdAt', 'DESC'],
                    ],
                    model: ModelParent, as: 'Parent', order: [
                        ['createdAt', 'DESC'],
                    ],
                    attributes: ['firstName, lastName']
                }
            ]
        }, true);
        return res.json(utils.JParser('All transaction fetched successfully', !!transaction, transaction));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//Parent transfer
exports.parentTransfer = useAsync(async (req, res) => {
    try {
        const pid = req.pid
        const options = {
            where: { pid }
        }

        const transaction = await paginated(ModelTransactions, req, options, true);
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//School transfer
exports.schoolTransfer = useAsync(async (req, res) => {
    try {
        const sid = req.sid
        const options = {
            where: { sid }
        }

        const transaction = await paginated(ModelTransactions, req, options, true);
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


//Admin (get parent/school transfer)
exports.adminUserTransfer = useAsync(async (req, res) => {
    try {
        const id = req.params.id
        const type = req.params.type
        let options;

        if (type === "school") {
            options = {
                where: { sid: id }
            }
        } else if (type === "parent") {
            options = {
                where: { pid: id }
            }
        }

        const transaction = await paginated(ModelTransactions, req, options, true);
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//Delete transaction
exports.deleteTransaction = useAsync(async (req, res) => {
    try {

        const tid = req.body.tid
        const options = {
            where: { tid }
        }

        await ModelTransactions.destroy(options)
        res.json(utils.JParser("Deleted successfully", false, []))

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

//Single transaction
exports.singleTransaction = useAsync(async (req, res) => {
    try {
        const tid = req.params.tid
        const options = {
            where: { tid }
        }

        const transaction = await ModelTransactions.findOne(options);
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//All withdraw
exports.allWithraw = useAsync(async (req, res) => {
    try {
        const options = {
            where: { serviceType: "Transfer" }
        }

        const transaction = await paginated(ModelTransactions, req, options, true);
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//All Deposit
exports.allDeposit = useAsync(async (req, res) => {
    try {
        const options = {
            where: { serviceType: "Deposit" }
        }

        const transaction = await paginated(ModelTransactions, req, options, true);
        ;
        res.json(utils.JParser('Transaction fetched successfully', !!transaction, transaction))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.generateTrxTokenHash = useAsync(async (req, res) => {
    try {
        const sid = req.sid
        const tid = 0
        const trxToken = generateTrxToken();
        const trxTk = { sid, tid, trxToken }
        await ModelTrxToken.create(trxTk)
        res.json(utils.JParser('Transaction token generated', !!trxToken, { trxToken }))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//Bank Transaction Latest
exports.bankTransfer = useAsync(async (req, res) => {
    try {
        const sid = req.sid
        const tranId = generateTransactionId(8)
        const ran = generateTransactionId(13)

        const trxToken = req.headers['x-hash'];

        //******************** 24hrs Check **************************//
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const mainTime = new Date();

        if ((mainTime - await (await ModelSchool.findByPk(sid)).createdAt) < twentyFourHours) {
            return res.status(501).json(utils.JParser('24-Hour Restriction: No transactions permitted yet.', false, {}))
        }
        //******************** 24hrs Check **************************//

        //************ Block user with bot-like transaction ******************//
        const { timeStatus, timeMsg } = await TrxTimeChecker(sid)
        if (timeStatus) return res.status(501).json(utils.JParser(timeMsg, false, {}))
        //************ Block user with bot-like transaction ******************//

        //*************** Trx Token Check && Trx Time Lapse *****************//
        if (!trxToken) return res.status(501).json(utils.JParser('Transaction denied -', false, {}))

        let trxTokenData = await ModelTrxToken.findOne({ where: { trxToken, isUsed: false, sid } })

        if (!trxTokenData) return res.status(501).json(utils.JParser('Transaction denied!', false, {}))

        const currentTime = new Date();

        const timeDifference = currentTime - trxTokenData?.createdAt;

        if (timeDifference > 60000) return res.status(501).json(utils.JParser('Transaction expired', false, {}))

        let lastTrx = await ModelTransactions.findOne({ where: { sid }, order: [['createdAt', 'DESC']], })

        let trxTimeDiff = currentTime - lastTrx?.createdAt

        if (trxTimeDiff < 60000) return res.status(501).json(utils.JParser('Transaction denied', false, {}))

        await trxTokenData.update({ transactionID: tranId, isUsed: true, status: "successful" })
        //*************** Trx Token Check && Trx Time Lapse *****************//


        res.header("Access-Control-Allow-Origin", "*");

        let { accountBank, accountNumber, amount, narration, currency, callbackUrl, debitCurrency, pin } = req.body

        const trxCurrency = 'NGN'

        const minimumTrx = 100

        const userOptions = {
            where: { sid }
        }

        amount = parseInt(amount)

        //*********** Charges ************//
        let charges = Charges(amount);
        const withCharges = amount + +charges
        //*********** Charges ************//

        //*********** Request Configs ************//
        const body = {
            "account_bank": accountBank,
            "account_number": accountNumber,
            "amount": amount,
            "narration": narration,
            "currency": currency,
            "reference": `TAAP_NGN_${ran}`,
            "callback_url": callbackUrl,
            "debit_currency": debitCurrency
        }
        let config = {
            method: 'post',
            url: 'https://api.flutterwave.com/v3/transfers',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
            },
            data: body
        };
        //*********** Request Configs ************//

        //*********** School Object ************//
        const school = await ModelSchool.findOne(userOptions);

        let originalPin
        let isBlocked;

        //*************** Decrypt Pin && School Check *****************//
        if (school) {
            isBlocked = school.blocked
            originalPin = DecryptPin(school.pin)
        } else {
            return res.status(404).json(utils.JParser('School not found', !!school, school))
        }
        //*************** Decrypt Pin && School Check *****************//

        //*************** Global *****************//
        let systemDowntime = await GlobalDisable()
        //*************** Global *****************//

        //*************** School's Account Restrictions *****************//
        if (!!school?.transferBlock) {
            return res.status(400).json(utils.JParser('Request Failed - Your transaction is blocked by the management, Please contact Support (Support@taap.com) if you think this was a mistake', false, []));
        } else if (!!isBlocked) {
            return res.status(400).json(utils.JParser('Request Failed - Sorry your account is blocked,  Please contact Support (Support@taap.com) if you think this was a mistake', !!isBlocked, isBlocked));
        } else if (!!systemDowntime) {
            //*************** System locked *****************//
            return res.status(400).json(utils.JParser('Request Failed - Sorry service temporarily unavailable, Please contact Support (Support@taap.com) if you think this was a mistake', !!systemDowntime, systemDowntime));
        } else if (originalPin !== pin) {
            //*************** Transfer Pin Cjeck *****************//
            return res.status(400).json(utils.JParser('Wrong PIN', false, []));
        } else {
            //get businesses oldBalance
            const oldBalance = school.balance
            const newBalance = oldBalance - withCharges

            //********** Row Check **********//
            // await TrxTimeChecker(sid)

            let { auditBalance, audit } = await RowCheck(sid, res)

            if (!audit) {
                await fraudulentTrx(sid, tranId, amount, withCharges, newBalance)
                return res.status(400).json(utils.JParser('Request Failed - Transaction audit failed Please contact Support (Support@taap.com) if you think this was a mistaket', false, []));
            }

            if (auditBalance < withCharges) {
                return res.status(400).json(utils.JParser('Not Enough Balance - Your transaction cannot be proceed. Please fund your account and try again later.', false, []));
            }
            //********** Row Check **********//


            if (oldBalance < withCharges) {
                return res.status(400).json(utils.JParser('Not Enough Balance - Your transaction cannot be proceed. Please fund your account and try again later.', false, []));
            } else {
                let response = await (await axios(config)).data
                const data = response.data;
                if (response && data) {

                    const flwId = data.id
                    //****** CRON *****//
                    await FlwTrxCron(flwId, tranId, sid, amount, withCharges, newBalance, oldBalance, total, tierOption, trxCurrency, narration, res)
                }
            }
        }

    } catch (e) {

        console.log(e)
        throw new errorHandle(e.message, 500)
    }
})

//School fees Transaction 
exports.schoolFeeTransfer = useAsync(async (req, res) => {
    const pid = req.pid
    const trxToken = req.headers['x-hash'];
    const t = await sequelize.transaction();

    //******************** 24hrs Check **************************//
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const mainTime = new Date();

    if ((mainTime - await (await ModelParent.findByPk(pid)).createdAt) < twentyFourHours) {
        return res.status(501).json(utils.JParser('24-Hour Restriction: No transactions permitted yet.', false, {}))
    }
    //******************** 24hrs Check **************************//

    //************ Block user with bot-like transaction ******************//
    const { timeStatus, timeMsg } = await TrxTimeChecker2(pid)
    if (timeStatus) return res.status(501).json(utils.JParser(timeMsg, false, {}))
    //************ Block user with bot-like transaction ******************//

    //*************** Trx Refs *****************//
    const transId = generateTransactionId(7)
    const ran = generateTransactionId(12)
    const rans = generateTransactionId(12)
    //*************** Trx Refs *****************//

    let { amount, sid, narration, pin } = req.body

    //*************** Trx Token Check && Trx Time Lapse *****************//
    if (!trxToken) return res.status(501).json(utils.JParser('Transaction denied -', false, {}))

    let trxTokenData = await ModelTrxToken.findOne({ where: { trxToken, isUsed: false, pid } })

    if (!trxTokenData) return res.status(501).json(utils.JParser('Transaction denied!', false, {}))

    const currentTime = new Date();

    const timeDifference = currentTime - trxTokenData?.createdAt;

    if (timeDifference > 60000) return res.status(501).json(utils.JParser('Transaction expired', false, {}))

    let lastTrx = await ModelTransactions.findOne({ where: { pid }, order: [['createdAt', 'DESC']], })

    let trxTimeDiff = currentTime - lastTrx?.createdAt

    if (trxTimeDiff < 60000) return res.status(501).json(utils.JParser('Transaction denied', false, {}))

    //*************** Check Trx 1-min Time Diff *****************//
    await trxTokenData.update({ transactionID: transId, isUsed: true, status: "successful" })
    //*************** Check Trx 1-min Time Diff *****************//
    //*************** Trx Token Check && Trx Time Lapse *****************//

    const trxCurrency = 'NGN'

    const minimumTrx = 10


    const userOptions = {
        where: { pid },
        transaction: t
    }

    amount = parseInt(amount)

    const sender = await ModelParent.findOne(userOptions);

    //*************** Decrypt Pin && Business Check *****************//
    let originalPin
    let isBlocked;

    if (sender) {
        isBlocked = sender.blocked
        originalPin = DecryptPin(sender.pin)
    } else {
        return res.status(404).json(utils.JParser('Parents not found', !!sender, sender))
    }
    //*************** Decrypt Pin && Business Check *****************//

    //*************** Wallet Tag Check *****************//
    if (!sid) return res.status(400).json({ msg: 'please check the fields' })
    //*************** Wallet Tag Check *****************//

    //*************** Receiver's Details *****************//
    const receiverOption = {
        where: { sid: sid }
    }
    const isSchool = !!await ModelParent.findOne(receiverOption)
    //*************** Receiver's Details *****************//

    //*************** Sender Details *****************//
    const senderOldBalance = sender.balance
    const senderFullName = sender.firstName + " " + sender.lastName
    const senderNewBalance = senderOldBalance - amount
    //*************** Sender Details *****************//

    //*************** Receiver's Details *****************//
    const receiver = await ModelSchool.findOne(receiverOption)
    const receiverOldBalance = receiver.balance
    let receiverNewBalance = +receiverOldBalance + +amount
    const receiverFullName = receiver.name
    //*************** Receiver's Details *****************//

    //*************** Global *****************//
    let systemDowntime = await GlobalDisable()
    //*************** Global *****************//

    //********** Row Check **********//

    let { auditBalance, audit } = await RowCheck2(pid, res)

    if (!audit) {
        await fraudulentTrx(bid, transId, amount, amount, auditBalance)
        return res.status(400).json(utils.JParser('Transaction audit failed please contact support', false, []));
    }

    if (auditBalance < amount) {
        return res.status(400).json(utils.JParser('Insufficient funds', false, []));
    }
    //********** Row Check **********//

    //********** Row Check **********//
    const senderMainBalance = await RowCheck2(pid, res)
    if (senderMainBalance < amount) {
        return res.status(400).json(utils.JParser('Insufficient funds', false, []));
    }
    //********** Row Check **********//

    if (sender.transferBlock === true) {
        //*************** Sender locked *****************//
        return res.status(400).json(utils.JParser('Your transaction is blocked by the management, Contact support if you think this a mistake', false, []));
    } else if (receiver.blocked === true) {
        //*************** Receiver locked *****************//
        return res.status(400).json(utils.JParser('Transaction to this account is blocked', false, []));
    } else if (!!systemDowntime) {
        //*************** System locked *****************//
        return res.status(400).json(utils.JParser('Sorry service temporarily unavailable', !!systemDowntime, systemDowntime));
    } else if (sender.pid === sid) {
        //*************** Self fund *****************//
        return res.status(400).json(utils.JParser('Sorry you can not send money to yourself', false, []))
    } else if (isBlocked === true) {
        //*************** Sender Account blocked *****************//
        return res.status(400).json(utils.JParser('Sorry your account is blocked', false, []))
    } else if (originalPin !== pin) {
        //*************** Pin Check *****************//
        return res.status(400).json(utils.JParser('Wrong pin', false, []))
    } else if (senderOldBalance < amount) {
        //*************** Balance check *****************//
        return res.status(400).json(utils.JParser('Insufficient funds', false, []))
    } else if (senderOldBalance < minimumTrx) {
        return res.status(400).json(utils.JParser('You do not have enough money', false, []))
    } else if (amount < minimumTrx) {
        return res.status(400).json(utils.JParser(`You can not send any money lower than ${trxCurrency}${minimumTrx}`, false, []))
    } else {

        try {

            const opt = {
                where: { amount: total }
            }

            const receiverId = receiver.sid

            //*************** Receiver Trx Body *****************//
            const receiverTrxData = {
                "amount": amount,
                "pid": sender.pid,
                "serviceType": "Deposit",
                "sid": receiverId,
                "narration": narration,
                "statusType": "Credit",
                "status": "successful",
                "transactionID": transId,
                "fullName": senderFullName,
                "bankName": "Taap",
                "creditAmount": amount,
                "reference": `TAAP_NGN_${ran}`,
                "balance": receiverNewBalance
            }
            //*************** Receiver Trx Body *****************//

            //*************** Sender Trx Body *****************//
            const senderTrxData = {
                "amount": amount,
                "sid": receiver.sid,
                "serviceType": "Transfer",
                "pid": pid,
                "narration": narration,
                "statusType": "Debit",
                "status": "successful",
                "transactionID": transId,
                "debitAmount": amount,
                "fullName": receiverFullName,
                "bankName": "Taap",
                "reference": `TAAP_NGN_${rans}`,
                "balance": senderNewBalance
            }

            // const transaction = await ModelTransactions.create(senderTrxData)
            // //*************** Sender Trx Body *****************//

            //I have to change the sender details creation because of aa

            if (senderTrxData) {

                //*************** Sender Balance Update ***************** XX//
                const senderUpdate = { balanceUpdatedAt: Date.now() }

                await sender.decrement("balance", { by: amount, transaction: t })
                await sender.update(senderUpdate, { transaction: t })
                //*************** Sender Balance Update ***************** XX//

                //*************** Receiver Balance Update *****************//
                const receiverUpdate = { walletUpdatedAt: Date.now() }
                await receiver.increment("balance", { by: amount, transaction: t })
                await receiver.update(receiverUpdate, { transaction: t })

                const recTrx = await ModelTransactions.create(receiverTrxData, { transaction: t })
                //*************** Receiver Balance Update *****************//

                const transaction = await ModelTransactions.create(senderTrxData, { transaction: t })
                //*************** Sender Trx Body *****************//

                //***** Main Trx ******//
                const mainTrxBodySender = {
                    bid: bid,
                    narration: narration,
                    debitAmount: amount,
                    fullName: senderFullName,
                    bankName: "Taap",
                    reference: `TAAP_NGN_${rans}`,
                    transactionID: transId,
                    tag: bid,
                    serviceType: "Transfer",
                    amount: parseFloat(transaction.amount),
                    prevBalance: parseFloat(senderOldBalance),
                    newBalance: senderNewBalance,
                    status: 'Successful',
                    statusType: 'Debit'
                }

                const mainTrxBodyReceiver = {
                    "sid": receiverId,
                    narration: narration,
                    fullName: receiverFullName,
                    bankName: "Taap",
                    creditAmount: amount,
                    reference: `TAAP_NGN_${ran}`,
                    transactionID: transId,
                    tag: receiver.sid,
                    serviceType: "Deposit",
                    amount: parseFloat(recTrx.amount),
                    prevBalance: parseFloat(receiverOldBalance),
                    newBalance: receiverNewBalance,
                    status: 'Successful',
                    statusType: 'Credit'
                }

                await ModelTrx.findOrCreate({
                    where: { tid: transaction.tid },
                    defaults: mainTrxBodySender,
                    transaction: t
                })

                await ModelTrx.findOrCreate({
                    where: { tid: recTrx.tid, sid: recTrx.sid },
                    defaults: mainTrxBodyReceiver,
                    transaction: t
                })
                //***** Main Trx ******//

                res.json(utils.JParser('Transaction Successful', !!transaction, transaction));

                //********* Sender's Notification ***********//
                let note = {
                    title: "Debit Alert",
                    body: `Your transfer of NGN${receiverTrxData?.amount.toLocaleString()} to ${receiverFullName} of ${receiverTrxData.bankName} was successful`,
                };
                Notify(pid, note.title, note.body, etpl.TransactionEmail, `NGN${receiverTrxData?.amount.toLocaleString()}`, 0)
                //********* Sender's Notification ***********//

                //********* Receiver's Notification ***********//
                let note2 = {
                    title: "Credit Alert",
                    body: `You have been credited the sum of NGN${receiverTrxData?.amount.toLocaleString()} from ${senderFullName} of ${receiverTrxData.bankName}`,
                };

                Notify(receiverId, note2.title, note2.body, etpl.TransactionEmail, `NGN${receiverTrxData?.amount.toLocaleString()}`, 0, {}, "", "", "")
                //********* School's Notification ***********//

            }

            await t.commit();
        } catch (e) {
            console.log(e)
            await t.rollback();
            throw new errorHandle(e.message, 400)
        }
    }
})