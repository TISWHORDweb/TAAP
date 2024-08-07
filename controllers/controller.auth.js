
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
            location: Joi.string().required(),
            ip: Joi.string().required(),
            device: Joi.string().required()
        })
        //capture user data
        const { email, password } = req.body;
        //validate user
        // const value = await schema.validateAsync({ email, password });
        const validator = await schema.validateAsync(req.body);
        const user = await checkMail(validator.email)
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
            let name;
            if (user.firstName) {
                name = user.firstName + " " + user.lastName
            } else {
                name = user.name
            }
            await user.update({ token, lastLogin });
            const body = {
                name: name,
                msg: `We noticed your TAAP account was logged in on ${device} from ${validator.location} with the IP address ${ip}, on <strong>${when}</strong>. If this was you, there’s no need to do anything. <br>
                <span>Not you? Change your password and kindly send an email to support@taap.com or reach us via in-app support.</span>
                `,
                subject: "Login Notification"
            }

            EmailNote(email, body.name, body.msg, body.subject, "")
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
        const validator = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(validator.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        validator.apiKey = sha1(validator.email + new Date().toISOString);
        validator.token = sha1(validator.email + new Date().toISOString)
        validator.password = await bcrypt.hash(validator.password, 13)
        validator.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        //insert into db
        const [parent, created] = await ModelParent.findOrCreate({
            where: { email: validator.email },
            defaults: validator
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
                email: validator.email,
                name: validator.firstName + " " + validator.lastName,
                body: `We're thrilled to welcome you to the Taap!  Your account is now successfully created, and you're ready to explore all that we have to offer. `,
                subject: "Welcome to TAAP!"
            }
            EmailNote(body.email, body.name, body.body, body.subject, "")
        }
    } catch (e) {
        console.log(e);
        throw new errorHandle(e.message, 202);
    }
});

/** SCHOOL REGISTRATION ROUTE */
exports.authSchoolRegister = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            name: Joi.string().min(2).max(150).required(),
            password: Joi.string().min(6).max(12).required()
        })
        //validate user
        const validator = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(validator.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        validator.apiKey = sha1(validator.email + new Date().toISOString);
        validator.token = sha1(validator.email + new Date().toISOString)
        validator.password = await bcrypt.hash(validator.password, 13)
        validator.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        const name = validator.name
        //insert into db
        const [school, created] = await ModelSchool.findOrCreate({
            where: { email: validator.email },
            defaults: validator
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
                email: validator.email,
                name: name,
                body: `We're thrilled to welcome you to the Taap!  Your account is now successfully created, and you're ready to explore all that we have to offer. `,
                subject: "Welcome to TAAP!"
            }
            EmailNote(body.email, body.name, body.body, body.subject, "")
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
        const validator = await schema.validateAsync(req.body);
        const MailCheck = await checkMail(validator.email)
        if (MailCheck) return res.json(utils.JParser('There is another user with this email, Change it and try again', false, []));
        //rebuild user object
        validator.apiKey = sha1(validator.email + new Date().toISOString);
        validator.token = sha1(validator.email + new Date().toISOString)
        validator.password = await bcrypt.hash(validator.password, 13)
        validator.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        //insert into db
        const [admin, created] = await ModelAdmin.findOrCreate({
            where: { email: validator.email },
            defaults: validator
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
                email: validator.email,
                name: validator.firstName + " " + validator.lastName,
                body: `We're thrilled to welcome you to the Taap!  Your account is now successfully created, and you're ready to explore all that we have to offer. `,
                subject: "Welcome to TAAP!"
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
        const user = await checkMail(email)
        const users = "User"

        //validate user
        await schema.validateAsync({ email });

        const body = {
            subject: "Email verification",
            description: `Thanks for joining TAAP! To complete your registration and access all the features, please verify your email address.
            <br><br>
            Just copy and paste the following code into the verification field <br>`,
            name: users
        }

        await user.update({ code: parseInt(code)}).then(() => {
            EmailNote(email, body.name, body.description, body.subject, code)
            res.json(utils.JParser("Email Verification code sent successfully", true, []));    
        })
    
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
            let name;
            if (user.firstName) {
                name = user.firstName + " " + user.lastName
            } else {
                name = user.name
            }
            let body = {
                subject: "Reset Your Password for TAAP",
                description: `We received a request to reset your password for your account on Taap. <br>
                <br> If you requested this reset, copy this code below and verify to create a new password
                `,
                name: name
            }

            await user.update({ code: parseInt(code), password: sha1(newPass), token: sha1(user.email + new Date().toUTCString)}).then(() => {
                EmailNote(email, body.name, body.description, body.subject, code)
                res.json(utils.JParser("Reeset successfully", true, []));
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
            code: Joi.number()
        })

        //capture user data
        const { email, code } = req.body;

        //validate user
        await schema.validateAsync({ email, code });

        //hash password before checking
        const user = await checkMail(email)

        if (user) {
            const userCode = user.code
            if (userCode === code) {
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


