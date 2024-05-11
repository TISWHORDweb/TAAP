const { ModelParent, ModelWebhook } = require("../models");
const sequelize = require("../database");
const axios = require('axios')
const cron = require("node-cron");

exports.webHook = useAsync(async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const tid = Math.floor(1000000 + Math.random() * 9000000)
        const checkType = req.body
        const data = {
            response: req.body
        }
        if (checkType.data.status !== "success") {
            await ModelWebhook.create({ response: data.response })

            const payload = req.body
            // console.log(payload)
            // It's a good idea to log all received events.;
            const csEmail = payload.data.customer.email;
            const txAmount = payload.data.amount;
            const paymentType = payload.data.payment_type;
            const posNarration = payload.data.narration;
            const txReference = payload.data.tx_ref;
            const flwId = payload.data.id;
            let serviceType = 'Deposit'


            // find parent on the database using the email
            const email = csEmail
            let options = {}
            ///NOT SHOOTING
            let id = 0;
            let oldAmount = 0.00
            let newAmount = 0.00
            if (paymentType === 'bank_transfer') {
                options = {
                    where: { email }
                }
                const user = await ModelParent.findOne(options);
                id = user.pid;

                const { charge, chgBalance } = await DepositCharge(id, tid, txAmount, t)
                oldAmount = chgBalance
                newAmount = oldAmount + +txAmount
            }

            options.transaction = t

            let config = {
                method: 'get',
                url: `https://api.flutterwave.com/v3/transactions/${flwId}/verify`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
                }
            };
            await axios(config).then(async (response) => {
                const data = response.data.data

                const senderName = data.meta.originatorname
                const senderBankName = data.meta.bankname

                console.log('\x1b[36m%s\x1b[0m', "TRANSACTION CHECK STATUS: " + data.status);

                if (data.status !== "success") {
                    if (data.status === "successful") {
                        const details = {
                            "transactionID": tid,
                            "serviceType": serviceType,
                            "amount": txAmount,
                            "status": data.status,
                            "statusType": 'Credit',
                            "email": csEmail,
                            "reference": txReference,
                            "narration": payload.data.narration,
                            "pid": id,
                            "flwid": data.id,
                            "creditAmount": txAmount,
                            "fullName": senderName,
                            "bankName": senderBankName,
                            "balance": newAmount
                        }

                        const [transaction, created] = await ModelTransactions.findOrCreate({
                            where: {
                                [Op.or]: [
                                    { flwid: data.id },
                                    { transactionID: tid }
                                ],
                                amount: txAmount
                            },
                            defaults: details,
                            transaction: t
                        })

                        //***** Main Trx ******//
                        const mainTrxBody = {
                            amount: parseFloat(txAmount),
                            prevBalance: parseFloat(oldAmount),
                            status: 'Successful',
                            statusType: 'Credit',
                            newBalance: newAmount,
                            serviceType: "Deposit",
                            ...details,
                            pid: details.pid
                        }
                        //***** Main Trx ******//
                        //Notification--------------------------------------------
                        let note2 = {
                            title: "Credit Alert",
                            body: `You have been credited the sum of NGN${txAmount?.toLocaleString()} from ${senderName} of ${senderBankName}`,
                        };

                        const body = { balance: newAmount, balanceUpdatedAt: Date.now() }
                        if (created) {
                            if (paymentType === 'bank_transfer') {
                                await ModelTrx.findOrCreate({
                                    where: {
                                        [Op.or]: [
                                            { flwid: data.id },
                                            { tid: transaction.tid }
                                        ],
                                        amount: txAmount
                                    },
                                    defaults: mainTrxBody,
                                    transaction: t
                                })

                                await ModelParent.update(body, options)

                                Notify(id, note2.title, note2.body, etpl.TransactionEmail, `NGN${txAmount?.toLocaleString()}`, 0)
                            }
                        }
                        return res.json(utils.JParser("Deposit Successful", true, []));

                    } else if (data.status === "failed") {

                        const details = {
                            "transactionID": tid,
                            "statusType": 'Credit',
                            "serviceType": serviceType,
                            "amount": txAmount,
                            "status": data.status,
                            "email": csEmail,
                            "reference": txReference,
                            "narration": payload.data.narration,
                            "pid": id,
                            "flwid": data.id,
                            "creditAmount": txAmount,
                            "fullName": senderName,
                            "bankName": senderBankName,
                            "balance": newAmount
                        }
                        if (data.status !== "success") {

                            await ModelTransactions.findOrCreate({
                                where: {
                                    [Op.or]: [
                                        { flwid: data.id },
                                        { transactionID: tid }
                                    ]
                                },
                                defaults: details,
                                transaction: t
                            }).then(() => {

                                // send failed response
                                return res.json(utils.JParser("Transaction failed", false, []));
                            })

                            // } else if (data.status === "pending") {

                            const task = cron.schedule('* * * * *', () => {
                                axios(config).then(async (response) => {
                                    console.log(details)

                                    const data = response.data

                                    const senderName = data?.meta?.originatorname
                                    const senderBankName = data?.meta?.bankname
                                    if (data.data.status === "successful") {
                                        const details = {
                                            "transactionID": tid,
                                            "serviceType": serviceType,
                                            "amount": txAmount,
                                            "status": data.status,
                                            "email": csEmail,
                                            "reference": txReference,
                                            "narration": payload.data.narration,
                                            "pid": id,
                                            "flwid": data.id,
                                            "creditAmount": req.body.amount,
                                            "fullName": senderName,
                                            "bankName": senderBankName,
                                            "balance": newAmount
                                        }
                                        //***** Main Trx ******//
                                        const mainTrxBody = {
                                            amount: parseFloat(txAmount),
                                            prevBalance: parseFloat(oldAmount),
                                            status: 'Successful',
                                            statusType: 'Credit',
                                            newBalance: newAmount,
                                            serviceType: serviceType,
                                            ...details,
                                            pid: details.pid,
                                        }
                                        //***** Main Trx ******//
                                        // update the parent's balance on the database
                                        // save updated transaction details to the database
                                        let [transaction, created2] = await ModelTransactions.findOrCreate({
                                            where: {
                                                [Op.or]: [
                                                    { flwid: data.id },
                                                    { transactionID: tid }
                                                ]
                                            },
                                            defaults: details,
                                            transaction: t
                                        })
                                        //Notification--------------------------------------------
                                        let note2 = {
                                            title: "Credit Alert",
                                            body: `You have been credited the sum of NGN${txAmount?.toLocaleString()} from ${senderName} of ${senderBankName}`,
                                        };

                                        // update the parent's balance on the database
                                        const body = { balance: newAmount, balanceUpdatedAt: Date.now() }
                                        if (created2) {

                                            if (paymentType === 'bank_transfer') {
                                                await ModelTrx.findOrCreate({
                                                    where: {
                                                        [Op.or]: [
                                                            { flwid: data.id },
                                                            { tid: tid }
                                                        ]
                                                    },
                                                    defaults: mainTrxBody,
                                                    transaction: t
                                                })

                                                await ModelParent.update(body, options)

                                                Notify(id, note2.title, note2.body, etpl.TransactionEmail, `NGN${txAmount?.toLocaleString()}`, 0)
                                            }
                                        }
                                        console.log("successful")
                                        res.json(utils.JParser("Deposit Successful", true, []));
                                        task.stop();

                                    } else if (data.data.status === "failed") {
                                        if (data.status !== "success") {

                                            const details = {
                                                "transactionID": tid,
                                                "serviceType": serviceType,
                                                "amount": txAmount,
                                                "status": data.status,
                                                "email": csEmail,
                                                "reference": txReference,
                                                "narration": payload.data.narration,
                                                "pid": id,
                                                "flwid": data.id,
                                                "creditAmount": txAmount,
                                                "fullName": senderName,
                                                "bankName": senderBankName,
                                                "balance": newAmount
                                            }

                                            await ModelTransactions.findOrCreate({
                                                where: {
                                                    [Op.or]: [
                                                        { flwid: data.id },
                                                        { transactionID: tid }
                                                    ]
                                                },
                                                defaults: details,
                                                transaction: t
                                            })
                                            console.log("failed")
                                            res.json(utils.JParser("Transaction failed", false, []));
                                            task.stop();
                                        }
                                        task.stop();
                                    }
                                })

                                console.log("pending")

                            });

                            task.start();
                        }
                    }
                }
            })
        }
        await t.commit();
    } catch (e) {
        console.log(e)
        await t.rollback();
        throw new errorHandle(e.message, 400);
    }
});