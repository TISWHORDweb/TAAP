
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { generatePassword, checkMail } = require("../core/core.utils");
const { ModelSchool } = require("../models");
const { EmailNote } = require("../core/core.notify");

exports.createSchool = useAsync(async (req, res) => {

    try {

        const Password = await generatePassword(9);
        const email = req.body.email
        if (Password) {
            req.body.password = await bcrypt.hash(Password, 13)
        }

        if (!email || !req.body.name) return res.json(utils.JParser('please check the fields', false, []));

        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await checkMail(req.body.email)
        if (validates) {
            return res.json(utils.JParser('There is another user with this email', false, []));
        } else {

            let School = await new ModelSchool(req.body)

            const body = {
                email: email,
                name: req.body.name,
                message: `Congratulastion an account has been created for you in TAAP kindly login with your email and the following password - ${Password}`,
                subject: "Account creation"
            }

            await School.save().then(data => {

                data.password = "********************************"

                EmailNote(body.email, body.name, body.message, body.subject)

                return res.json(utils.JParser('School created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.editSchool = useAsync(async (req, res) => {

    try {

        const sid = req.body.id
        const options = {
            where: { sid }
        }
        const body = req.body

        if (!sid) return res.status(402).json(utils.JParser('School not found', false, []));

        await ModelSchool.update(body, options).then(async () => {
            const school = await ModelSchool.findOne(options);
            return res.json(utils.JParser('School Update Successfully', !!school, school));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleSchool = useAsync(async (req, res) => {

    try {
        const sid = req.params.id
        const options = {
            where: { sid }
        }

        if (!sid) return res.status(402).json(utils.JParser('id not found', false, []));

        const school = await ModelSchool.findOne(options);
        if (school) {
            return res.json(utils.JParser('School fetch successfully', !!school, school));
        } else {
            return res.status(402).json(utils.JParser('School not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSchool = useAsync(async (req, res) => {

    try {
        const sid = req.sid
        const options = {
            where: { sid }
        }

        if (!sid) return res.status(402).json(utils.JParser('id not found', false, []));

        const school = await ModelSchool.findOne(options);
        if (school) {
            return res.json(utils.JParser('School fetch successfully', !!school, school));
        } else {
            return res.status(402).json(utils.JParser('School not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allSchool = useAsync(async (req, res) => {

    try {
        const school = await ModelSchool.findAll();
        if (!school) return res.status(402).json(utils.JParser('School not found', false, []));
        return res.json(utils.JParser('All School fetch successfully', !!school, school));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteSchool = useAsync(async (req, res) => {
    try {
        const sid = req.body.id
        const options = {
            where: { sid }
        }

        if (!sid) return res.status(402).json(utils.JParser('provide the school id', false, []));

        const school = await ModelSchool.destroy(options)
        return res.json(utils.JParser('School deleted successfully', !!school, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

exports.changeSchoolStatus = useAsync(async (req, res) => {

    try {

        const sid = req.body.id
        const status = parseInt(req.params.status)
        if (!sid || !status) return res.status(402).json(utils.JParser('School not found', false, []));

        const options = {
            where: { sid }
        }
        let body;

        if (status === 1) {
            body = { status: true }
        } else if (status === 2) {
            body = { status: false }
        }

        if (body) {
            await ModelSchool.update(body, options).then(async () => {
                const school = await ModelSchool.findOne(options);
                return res.json(utils.JParser('School Update Successfully', !!school, school));
            })
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.blockSchool = useAsync(async (req, res) => {

    try {

        const sid = req.body.id
        if (!sid) return res.status(402).json(utils.JParser('School not found', false, []));

        const status = parseInt(req.params.status)
        const options = {
            where: { sid }
        }
        let body;

        if (status === 1) {
            body = { blocked: true }
        } else if (status === 2) {
            body = { blocked: false }
        }

        if (body) {
            await ModelSchool.update(body, options).then(async () => {
                const school = await ModelSchool.findOne(options);
                return res.json(utils.JParser('School Update Successfully', !!school, school));
            })
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})