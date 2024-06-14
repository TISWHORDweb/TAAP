const useAsync = require('./../core/core.async');
const { utils, errorHandle } = require("../core");
const { ModelBank } = require('./../models');
const Flutterwave = require('flutterwave-node-v3');
const Joi = require("joi");
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);


///Bank
exports.addBank = useAsync(async (req, res) => {
    const sid = req.sid
    try {
        if (!sid) return res.status(400).json(utils.JParser('id not found', false, []));

        const options = {
            where: { sid }
        }

        const check = await ModelBank.findOne(options)
        
        if (check) return res.json(utils.JParser('This school have added their bank already ', false, []))
        const schema = Joi.object({
            bankAccountNumber: Joi.required(),
            bankCode: Joi.required(),
            bankName: Joi.required()
        })

        //validate business
        const validator = await schema.validateAsync(req.body);
        const details = {
            account_number: validator.bankAccountNumber,
            account_bank: validator.bankCode
        };

        await flw.Misc.verify_Account(details).then(async response => {
            console.log(response)
            if (response) {
                const body = {
                    sid: sid,
                    bankAccountNumber: validator.bankAccountNumber,
                    bankName: validator.bankName,
                    bankCode: validator.bankCode,
                    accountName: response.data.account_name
                }

                let bank = await ModelBank.create(body)
                return res.json(utils.JParser('Banks added successfully', !!bank, bank))
            }

        }).catch((error) => {
            return res.json(utils.JParser('Invalid account number or bank name, Check and retry', false, error))
        })
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

// exports.allBank = useAsync(async (req, res) => {
//     try {
//         const bank = await ModelBank.findAll();
//         res.json(utils.JParser("All banks ", !!bank, bank?.reverse()));
//     } catch (e) {
//         throw new errorHandle(e.message, 400)
//     }
// })

exports.singleBank = useAsync(async (req, res) => {
    try {
        const bid = req.params.id
        const options = {
            where: { bid }
        }

        const bank = await ModelBank.findOne(options);
        res.json(utils.JParser('Bank fetched successfully', !!bank, bank))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.schoolBank = useAsync(async (req, res) => {
    try {
        const sid = req.sid
        const options = {
            where: { sid }
        }

        const bank = await ModelBank.findOne(options);
        res.json(utils.JParser('Banks fetched successfully', !!bank, bank))
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteBank = useAsync(async (req, res) => {
    try {

        const bid = req.body.id
        const options = {
            where: { bid }
        }

        let del = await ModelBank.destroy(options)
        !!del ? res.json(utils.JParser("Deleted successfully", !!del, [])) : res.json(utils.JParser("Bank not found", !!del, del), 404)
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.AllverifyBanks = useAsync(async (req, res) => {
    try {
        const url = "https://api.flutterwave.com/v3/banks/NG"
        const config = {
            method: "GET", // *GET, POST, PUT, DELETE, etc.
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
            }
        }

        let banks = await (await fetch(url, config)).json()
        console.log(banks);
        banks = banks.data
        if (!banks) banks = require('../banks.json')
        //**** Sort in alphabetical order ****//
        banks = banks.sort((a, b) => a.name.localeCompare(b.name))

        banks = banks.filter(obj => obj.code.length <= 3);
        return res.json(utils.JParser('fetched successfully', !!banks, banks));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})
