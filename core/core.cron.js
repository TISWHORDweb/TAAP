const axios = require("axios");
const {ModelTier, ModelTransactions, ModelBusiness, ModelTrx} = require("../models");
const {utils, errorHandle} = require("./index");
const {Notify} = require("./core.notify");
const {etpl} = require("../services");
const cron = require("node-cron");
const {DebitAccount, RefundAccount, UpdateDailyLimit, GetCharge} = require("./core.utils");
const {JParser} = require("./core.utils");
const RateLimiter = require('./core.rate.limiter')
const rateLimiter = new RateLimiter(60, 60 * 1000); // Allow 60 requests per minute

exports.FlwTrxCron = async (flwId, tranId, sid, amount, withCharges, newBalance, oldBalance, total, tierOption, trxCurrency, narration, res = false) => {
    console.log('\x1b[43m%s\x1b[0m', "CRON TASK");
    // Check if the user is rate limited
    if (rateLimiter.isRateLimited(sid)) {
        console.log('Rate limit exceeded for user: ' + sid);
        return; // Exit the function or handle rate limit exceeded error
    }

    rateLimiter.addRequest(sid);

    const configs = {
        method: 'get',
        url: `https://api.flutterwave.com/v3/transfers/${flwId}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
        }
    };
    try {
        let response = await (await axios(configs)).data
        let data = response.data


        //********* Debit Business && Create Transaction **********//
        let {
            transaction,
            debited
        } = await DebitAccount(sid, data, tranId, amount, withCharges, newBalance, narration, oldBalance)

        const charge = GetCharge(amount)
        newBalance = newBalance - charge
        oldBalance = oldBalance - charge

        if (debited) {
            console.log('debited')
            transaction = await ModelTransactions.findOne({
                where: {transactionID: tranId, flwid: data.id}
            })
        } else {
            console.log('No')

            transaction = await ModelTransactions.findOne({
                where: {transactionID: tranId, flwid: data.id, status: "pending"}
            })
        }
        //********* Debit School && Create Transaction **********//

        const failedBody = {issue: 1, status: "failed", balance: oldBalance}
        const successBody = {issue: 0, status: "successful"}
        const pendingBody = {issue: 2, status: "pending"}

        const mainTrxBody = {
            sid: sid,
            tid: transaction.tid,
            flwid: data.id,
            transactionID: tranId,
            serviceType: "Transfer",
            fullName: data.full_name,
            accountNumber: data.account_number,
            bankName: data.bank_name,
            issue: 0,
            reference: data.reference,
            amount: parseFloat(transaction.amount),
            prevBalance: parseFloat(oldBalance),
            newBalance: parseFloat(newBalance),
            status: 'Successful',
            statusType: 'Debit',
            narration
        }


        //********* Trx Successful **********//
        if (data.status === "SUCCESSFUL") {

            const response2 = await (await axios(configs)).data

            data = response2.data
            if (data.status === "FAILED") {
                await transaction.update(failedBody).then(async () => {
                    console.log('\x1b[31m%s\x1b[0m', "Changed successful to failed transaction");
                })
                if (res) {
                    return res.status(400).json(JParser('Transaction Failed', false, transaction))
                } else {
                    console.log('\x1b[31m%s\x1b[0m', "Transaction Failed")
                }
            } else {
                //***** Main Trx ******//
                await ModelTrx.findOrCreate({where: {tid: transaction.tid}, defaults: mainTrxBody})
                //***** Main Trx ******//
                await transaction.update(successBody)
                console.log('\x1b[32m%s\x1b[0m', "Transaction Successful");

                if (res) {
                    return res.json(JParser('Transaction Successful', !!transaction, transaction))
                } else {
                    console.log('\x1b[32m%s\x1b[0m', "Transaction Successful")
                    //*********** Notification ************//
                    let note = {
                        title: "Debit Alert",
                        body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} was successful`,
                        channelId: 'channelId'
                    };
                    Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                    //*********** Notification ************//
                }
            }


        }
            //********* Trx Successful **********//

        //********* Trx Failed **********//
        else if (data.status === "FAILED") {
            console.log('\x1b[31m%s\x1b[0m', "FAILED");

            await transaction.update(failedBody).then(async () => {
                if (res) {
                    return res.status(400).json(JParser('Transaction Failed', false, transaction))
                } else {
                    console.log('\x1b[31m%s\x1b[0m', "Transaction Failed")
                }
            })

            await RefundAccount(sid, oldBalance)

            //*********** Notification ************//
            let note = {
                title: "Failed Transaction",
                body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} failed`,
                channelId: 'channelId'
            };

            Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
            //*********** Notification ************//
        }
            //********* Trx Failed **********//

        //********* Trx Pending **********//
        else if (data.status === "PENDING") {
            console.log('\x1b[33m%s\x1b[0m', "Transaction Pending");

            await transaction.update(pendingBody)
            console.log('\x1b[33m%s\x1b[0m', "Pending transaction debited already");

            const task = cron.schedule('* * * * *', async () => {
                const updatedResponse = await axios(configs);
                const updatedData = updatedResponse.data.data;


                if (updatedData.status === "SUCCESSFUL") {
                    console.log('\x1b[32m%s\x1b[0m', "Transaction Successful");

                    const finalResponse = await axios(configs);
                    const finalData = finalResponse.data.data;


                    if (finalData.status === "FAILED") {

                        await transaction.update(failedBody).then(() => {
                            console.log('\x1b[31m%s\x1b[0m', "Changed successful to failed transaction");
                        })

                        await RefundAccount(sid, oldBalance)

                        //*********** Notification ************//
                        let note = {
                            title: "Failed Transaction",
                            body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} failed`,
                            channelId: 'channelId'
                        };

                        Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                        //*********** Notification ************//

                    } else {
                        //***** Main Trx ******//
                        await ModelTrx.findOrCreate({where: {tid: transaction.tid}, defaults: mainTrxBody})
                        //***** Main Trx ******//
                        await transaction.update(successBody)
                        console.log('\x1b[32m%s\x1b[0m', "successful");

                        //*********** Notification ************//
                        let note = {
                            title: "Debit Alert",
                            body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} was successful`,
                            channelId: 'channelId'
                        };
                        Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                        //*********** Notification ************//
                    }
                    task.stop();
                } else if (data.status === "FAILED") {
                    await transaction.update(failedBody)
                    console.log('\x1b[31m%s\x1b[0m', "failed");

                    await RefundAccount(sid, oldBalance)

                    //*********** Notification ************//
                    let note = {
                        title: "Failed Transaction",
                        body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} failed`,
                        channelId: 'channelId'
                    };

                    Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                    //*********** Notification ************//
                    task.stop();
                }
                console.log('\x1b[33m%s\x1b[0m', "inside");
            });

            task.start();
            if (res) {
                return res.json(JParser('Transaction Pending', !!transaction, transaction));
            }
        }
            //********* Trx Pending **********//

        //********* Trx New **********//
        else if (data.status === "NEW") {

            console.log('\x1b[36m%s\x1b[0m', "New Transaction Pending");

            await transaction.update(pendingBody)
            console.log('\x1b[36m%s\x1b[0m', "Pending transaction debited already");

            const task = cron.schedule('* * * * *', async () => {
                const response4 = await (await axios(configs)).data
                const data = response4.data

                if (data.status === "SUCCESSFUL") {
                    console.log('\x1b[32m%s\x1b[0m', "Transaction Successful");

                    const finalResponse = await axios(configs);
                    const finalData = finalResponse.data.data;

                    if (finalData.status === "FAILED") {
                        await transaction.update(failedBody)
                        console.log('\x1b[31m%s\x1b[0m', "Changed successful to failed transaction");

                        await RefundAccount(sid, oldBalance);

                        //*********** Notification ************//
                        let note = {
                            title: "Failed Transaction",
                            body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} failed`,
                            channelId: 'channelId'
                        };

                        Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0);
                        //*********** Notification ************//
                    } else {
                        //***** Main Trx ******//
                        await ModelTrx.findOrCreate({where: {tid: transaction.tid}, defaults: mainTrxBody})
                        //***** Main Trx ******//
                        await transaction.update(successBody)
                        console.log('\x1b[32m%s\x1b[0m', "Successful");


                        //*********** Notification ************//
                        let note = {
                            title: "Debit Alert",
                            body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} was successful`,
                            channelId: 'channelId'
                        };

                        Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                        //*********** Notification ************//
                    }


                    task.stop();
                } else if (data.status === "FAILED") {
                    await transaction.update(failedBody)
                    console.log('\x1b[31m%s\x1b[0m', "Transaction Failed");

                    await RefundAccount(sid, oldBalance)

                    //*********** Notification ************//
                    let note = {
                        title: "Failed Transaction",
                        body: `Your transfer of ${trxCurrency}${data?.amount.toLocaleString()} to ${data.full_name} of ${data.bank_name} failed`,
                        channelId: 'channelId'
                    };

                    Notify(sid, note.title, note.body, etpl.TransactionEmail, `${trxCurrency}${data?.amount.toLocaleString()}`, 0)
                    //*********** Notification ************//

                    task.stop();
                }
            })

            console.log('\x1b[33m%s\x1b[0m', "inside");
            task.start();
            if (res) {
                return res.json(JParser('Transaction Successful', !!transaction, transaction));
            }
        }
        //********* Trx New **********//
    } catch (e) {
        if (res) {
            throw new errorHandle(e.message, 500);
        } else {
            console.log('\x1b[31m%s\x1b[0m', e.message);
        }
    }

    console.log('\x1b[36m%s\x1b[0m', "TRX: " + tranId);
}
