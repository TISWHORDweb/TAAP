const { FlwTrxCron } = require("../core/core.cron");
const { paginated, generateTransactionId, generateTrxToken, Charges, DecryptPin, GlobalDisable, CurrentDate, fraudulentTrx, RowCheck } = require("../core/core.utils");
const { ModelTransactions, ModelSchool, ModelTrxToken, ModelParent } = require("../models");
const {useAsync, utils, errorHandle,} = require('./../core');
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
            where: {pid}
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
            where: {sid}
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
        let options ;

        if(type === "school"){
            options = {
                where: {sid:id}
            }
        } else  if(type === "parent"){
            options = {
                where: {pid:id}
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
            where: {tid}
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
            where: {tid}
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
            where: {serviceType: "Transfer"}
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
            where: {serviceType: "Deposit"}
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
            "reference": `MGR_NGN_${ran}`,
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
