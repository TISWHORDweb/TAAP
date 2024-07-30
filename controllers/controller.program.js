
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { generatePassword, checkMail } = require("../core/core.utils");
const { ModelSchool, ModelProgram } = require("../models");
const { EmailNote } = require("../core/core.notify");

exports.createProgram = useAsync(async (req, res) => {

    try {

        const sid = req.sid
        req.body.sid = sid
        if (!req.body.name || !req.body.sid || !req.body.amount || !req.body.deadline) return res.json(utils.JParser('please check the fields', false, []));
        //         const options = {
        //             wheere:{sid:sid,name: req.body.name}
        //         }

        //         const validates = await ModelProgram.findOne(options)
        // console.log(options,validates)
        //         if (validates) {
        //             return res.json(utils.JParser('This program have been created by you before', false, []));
        //         } else {

        let Program = await new ModelProgram(req.body)

        await Program.save().then(data => {

            return res.json(utils.JParser('Program created successfully', !!data, data));

        })
        // }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.editProgram = useAsync(async (req, res) => {

    try {

        const prid = req.body.id
        const options = {
            where: { prid }
        }
        const body = req.body

        if (!prid) return res.status(402).json(utils.JParser('Program not found', false, []));

        await ModelProgram.update(body, options).then(async () => {
            const program = await ModelProgram.findOne(options);
            return res.json(utils.JParser('Program Update Successfully', !!program, program));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleProgram = useAsync(async (req, res) => {

    try {
        const prid = req.params.id
        const options = {
            where: { prid }
        }

        if (!prid) return res.status(402).json(utils.JParser('id not found', false, []));

        const program = await ModelProgram.findOne(options);
        if (program) {
            return res.json(utils.JParser('Program fetch successfully', !!program, program));
        } else {
            return res.status(402).json(utils.JParser('Program not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSchoolProgram = useAsync(async (req, res) => {

    try {
        const sid = req.sid
        const options = {
            where: { sid }
        }

        if (!sid) return res.status(400).json(utils.JParser('id not found', false, []));

        const program = await ModelProgram.findAll(options);
        if (program) {
            return res.json(utils.JParser('Program fetch successfully', !!program, program));
        } else {
            return res.status(400).json(utils.JParser('This school dont have any program yet', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSchoolProgramById = useAsync(async (req, res) => {

    try {
        const sid = req.params.id
        const options = {
            where: { sid }
        }

        if (!sid) return res.status(402).json(utils.JParser('id not found', false, []));

        const program = await ModelProgram.findAll(options);
        if (program) {
            return res.json(utils.JParser('Program fetch successfully', !!program, program));
        } else {
            return res.status(402).json(utils.JParser('Program not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allProgram = useAsync(async (req, res) => {

    try {
        const program = await ModelProgram.findAll();
        if (!program) return res.status(402).json(utils.JParser('Program not found', false, []));
        return res.json(utils.JParser('All Program fetch successfully', !!program, program));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteProgram = useAsync(async (req, res) => {
    try {
        const prid = req.body.id
        const options = {
            where: { prid }
        }

        if (!prid) return res.status(402).json(utils.JParser('provide the program id', false, []));

        const program = await ModelProgram.destroy(options)
        return res.json(utils.JParser('Program deleted successfully', !!program, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});
