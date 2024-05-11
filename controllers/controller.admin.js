
const sha1 = require('sha1');
const Joi = require('joi');
/**
 * importing custom model
 */
const {useAsync, utils, errorHandle,} = require('./../core');
const {emailTemple, etpl} = require('./../services');
/**
 * importing models
 */
const {ModelUser, ModelSchool, ModelGlobal} = require('./../models');
const { EmailNote } = require('../core/core.notify');
/**
 * @type {function(*=, *=, *=): Promise<unknown>}
 */
exports.index = useAsync(async (req, res) => {
    res.json(utils.JParser("Welcome to admin api", true, {}));
})
/**
 * @route-controller /api/v1/admin/start
 * @type {function(*=, *=, *=): Promise<unknown>}
 */
exports.adminStats = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({minDomainSegments: 2}).required(),
        })
        //capture user data
        const {email} = req.body;
        //validate user
        const validator = await schema.validateAsync({email});
        //hash password before checking
        const newPass = utils.AsciiCodes(8);
        const user = await ModelUser.findOne({where: validator});
        if (user) {
            const uuser = user.update({password: sha1(newPass), token: sha1(user.email + new Date().toUTCString)});
            if (uuser) {
                /**
                 * Change email template before productions
                 */
                new emailTemple(user.email)
                    .who(user.fullname)
                    .body("You requested for a password reset<br/>" +
                        "A new password has been generated for you, do login and change it immediately" +
                        "<h1 style='margin-top: 10px; margin-bottom: 10px;'>" +newPass+"</h1>"+
                        "Check out our new courses.")
                    .subject(etpl.PasswordReset).send().then(r => console.log(r));
            }
        }
        res.json(utils.JParser("ok-response", !!user, user));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


////GLOBAL
exports.createGlobal = useAsync(async (req, res) => {
    try {

        let global = await ModelGlobal.create(req.body)
        return res.json(utils.JParser('Banks added successfully', !!global, global))

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.global = useAsync(async (req, res, next) => {
    try {
        const global = await ModelGlobal.findAll();

        res.json(utils.JParser("ok-response", !!global, global));

    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.disableAllUsers = useAsync(async (req, res, next) => {
    try {
        const options = { where: { gid: process.env.GLOBAL_ID } }

        const body = { disableAllUsers: true, by: req.body.by }
        await ModelGlobal.update(body, options).then(async () => {
            let global = await ModelGlobal.findOne(options)
            res.json(utils.JParser("ok-response", !!global, global));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.enableAllUsers = useAsync(async (req, res, next) => {
    try {
        const options = { where: { gid: process.env.GLOBAL_ID } }

        const body = { disableAllUsers: false, by: req.body.by }
        await ModelGlobal.update(body, options).then(async () => {
            let global = await ModelGlobal.findOne(options)
            res.json(utils.JParser("ok-response", !!global, global));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.disableAllTransactions = useAsync(async (req, res, next) => {
    try {
        const options = { where: { gid: process.env.GLOBAL_ID } }

        const body = { disableAllTransfer: true, by: req.body.by }
        await ModelGlobal.update(body, options).then(async () => {
            let global = await ModelGlobal.findOne(options)
            res.json(utils.JParser("ok-response", !!global, global));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.enableAllTransactions = useAsync(async (req, res, next) => {
    try {
        const options = { where: { gid: process.env.GLOBAL_ID } }

        const body = { disableAllTransfer: false, by: req.body.by }
        await ModelGlobal.update(body, options).then(async () => {
            let global = await ModelGlobal.findOne(options)
            res.json(utils.JParser("ok-response", !!global, global));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});