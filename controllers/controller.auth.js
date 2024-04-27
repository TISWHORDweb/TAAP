
const sha1 = require('sha1');
const Joi = require('joi');
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
/**
 * importing custom model
 */
const { useAsync, utils, errorHandle, } = require('./../core');
const { emailTemple, etpl } = require('./../services');
/**
 * importing models
 */
const { ModelUser, ModelParent, ModelSchool, ModelAdmin } = require('./../models');
const { EmailNote } = require('../core/core.notify');
const { checkMail } = require('../core/core.utils');
/**
 * @type {function(*=, *=, *=): Promise<unknown>}
 */
exports.index = useAsync(async (req, res) => {
    res.json(utils.JParser("Welcome to auth api", true, {}));
})
/**
 * @route-controller /api/v1/auth/login
 * @type {function(*=, *=, *=): Promise<unknown>}
 */
exports.authLogin = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            password: Joi.string().min(6).max(12).required(),
            location: Joi.required(),
            ip: Joi.required(),
            device: Joi.required()
        })
        //capture user data
        const { email, password } = req.body;
        //validate user
        const validator = await schema.validateAsync({ email, password });
        const value = await schema.validateAsync(req.body);
        const user = await checkMail(value.email)
        if (!user) return res.json(utils.JParser('Invalid email or password', false, []));
        if (user.blocked === true) return res.json(utils.JParser('Sorry your account is blocked', false, []));
        const originalPassword = await bcrypt.compare(password, user.password);
        if (!originalPassword) {
            return res.json(utils.JParser('Invalid credentials verify your email and password and try again', false, []));
        } else {

            //get device details for login
            const ip = validator.ip;
            const timeElapsed = Date.now();
            const today = new Date(timeElapsed);
            const when = today.toUTCString();
            // const device = deviceType(os.platform());
            const device = validator.device;

            const token = sha1(req.body.email + new Date())
            const lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
            user.token = token
            user.password = "********************************"
            await user.update({ token, lastLogin });
            const body = {
                name: user.firstName + " " + user.lastName,
                msg: `We noticed your TAAP account was logged in on ${device} from ${validator.location} with the IP address ${ip}, on <strong>${when}</strong>. If this was you, there’s no need to do anything.`,
                subject: "Login Notification"
            }

            EmailNote(email, body.name, body.msg, body.subject)
            res.json(utils.JParser("Logged in successfully", !!user, user));
        }
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

/**
 * @route-controller /api/v1/auth/register
 * @type {function(*=, *=, *=): Promise<unknown>}
 */

/** PARENT REGISTRATION ROUTE */
exports.authParentRegister = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            firstName: Joi.string().min(2).max(150).required(),
            lastName: Joi.string().min(2).max(150).required(),
            password: Joi.string().min(6).max(12).required()
        })
        //validate user
        const value = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(value.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        value.apiKey = sha1(value.email + new Date().toISOString);
        value.token = sha1(value.email + new Date().toISOString)
        value.password = bcrypt.hash(value.password, 13)
        value.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        //insert into db
        const [parent, created] = await ModelParent.findOrCreate({
            where: { email: value.email },
            defaults: value
        });
        //indicate if the user is newx
        let newParent = JSON.parse(JSON.stringify(parent));
        newParent['created'] = created;
        newParent.password = "********************************"
        res.json(utils.JParser("Congratulation registration is successful", true, newParent));
        console.log(created);
        //send a welcome email here
        if (created) {
            const body = {
                email: value.email,
                name: value.firstName + " " + value.lastName,
                body: `Congratulastion your account has been created successfully`,
                subject: "Account creation"
            }
            EmailNote(body.email, body.name, body.body, body.subject)
        }
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

/** SCHOOL REGISTRATION ROUTE */
exports.authSchoolRegister = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            firstName: Joi.string().min(2).max(150).required(),
            lastName: Joi.string().min(2).max(150).required(),
            password: Joi.string().min(6).max(12).required()
        })
        //validate user
        const value = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(value.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        value.apiKey = sha1(value.email + new Date().toISOString);
        value.token = sha1(value.email + new Date().toISOString)
        value.password = bcrypt.hash(value.password, 13)
        value.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        //insert into db
        const [school, created] = await ModelSchool.findOrCreate({
            where: { email: value.email },
            defaults: value
        });
        //indicate if the user is newx
        let newSchool = JSON.parse(JSON.stringify(school));
        newSchool['created'] = created;
        newSchool.password = "********************************"
        res.json(utils.JParser("Congratulation registration is successful", true, newSchool));
        console.log(created);
        //send a welcome email here
        if (created) {
            const body = {
                email: value.email,
                name: value.firstName + " " + value.lastName,
                body: `Congratulastion your account has been created successfully`,
                subject: "Account creation"
            }
            EmailNote(body.email, body.name, body.body, body.subject)
        }
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


/** ADMIN REGISTRATION ROUTE */
exports.authAdminRegister = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            firstName: Joi.string().min(2).max(150).required(),
            lastName: Joi.string().min(2).max(150).required(),
            password: Joi.string().min(6).max(12).required()
        })
        //validate user
        const value = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(value.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        value.apiKey = sha1(value.email + new Date().toISOString);
        value.token = sha1(value.email + new Date().toISOString)
        value.password = bcrypt.hash(value.password, 13)
        value.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        //insert into db
        const [admin, created] = await ModelAdmin.findOrCreate({
            where: { email: value.email },
            defaults: value
        });
        //indicate if the user is newx
        let newAdmin = JSON.parse(JSON.stringify(admin));
        newAdmin['created'] = created;
        newAdmin.password = "********************************"
        res.json(utils.JParser("Congratulation registration is successful", true, newAdmin));
        console.log(created);
        //send a welcome email here
        if (created) {
            const body = {
                email: value.email,
                name: value.firstName + " " + value.lastName,
                body: `Congratulastion your account has been created successfully`,
                subject: "Account creation"
            }
            EmailNote(body.email, body.name, body.body, body.subject)
        }
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

/**
 * @route-controller /api/v1/auth/reset
 * @type {function(*=, *=, *=): Promise<unknown>}
 */

exports.authVerifyEmail = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })

        let code = Math.floor(100000 + Math.random() * 900000)

        //capture user data
        const { email } = req.body;

        //validate user
        await schema.validateAsync({ email });

        let body = {
            subject: "Email verification",
            description: `Please enter the code: ${code}`,
            name: "User"
        }

        EmailNote(email, body.name, body.description, body.subject, code)
        res.json(utils.JParser("Email reset successfully", true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


exports.authReset = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })

        let code = Math.floor(100000 + Math.random() * 900000)

        //capture user data
        const { email } = req.body;

        //validate user
        await schema.validateAsync({ email });

        //hash password before checking
        const newPass = "********************************";
        const user = await checkMail(req.body.email)

        if (user) {

            let body = {
                subject: "Password Recovery",
                description: `Please enter the code: ${code}`,
                name: user.firstName + " " + user.lastName
            }

            await user.update({ $set: { code: parseInt(code), password: sha1(newPass), token: sha1(user.email + new Date().toUTCString) } }).then(() => {
                EmailNote(email, body.name, body.description, body.subject, code)
                res.json(utils.JParser("Email reset successfully", true, []));
            })
        } else {
            return res.json(utils.JParser('Sorry theres no user with this mail', false, []));
        }


    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.authVerify = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string(),
            code: Joi.string()
        })

        //capture user data
        const { email, code } = req.body;

        //validate user
        await schema.validateAsync({ email, code });

        //hash password before checking
        const user = await checkMail(email)

        if (user) {
            const userCode = user.code
            if (userCode === parseInt(code)) {
                return res.json(utils.JParser('Verified', true, []));
            } else {
                return res.json(utils.JParser('Incorrect code', false, []));
            }
        } else {
            return res.json(utils.JParser('User not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.authResetPassword = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            newPassword: Joi.string().required()
        })

        //validate user
        const validator = await schema.validateAsync(req.body);

        //hash password before checking
        const user = await checkMail(req.body.email)
        if (user) {

            if (user.blocked === false) {
                await user.update({
                    password: await bcrypt.hash(validator.newPassword, 13),
                    token: sha1(user.email + new Date().toUTCString),
                });

                res.json(utils.JParser("Password reset successfully", !!user, []));
            } else {
                res.status(400).json(utils.JParser("User blocked", false, {}));
            }

        } else {
            res.status(400).json(utils.JParser("Password reset failed", false, {}));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


