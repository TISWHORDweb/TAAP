
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { ModelParent } = require("../models");


exports.editParent = useAsync(async (req, res) => {

    try {

        const pid = req.body.id
        const options = {
            where: { pid }
        }
        const body = req.body

        if (!pid) return res.status(402).json(utils.JParser('Parent not found', false, []));

        await ModelParent.update(body, options).then(async () => {
            const parent = await ModelParent.findOne(options);
            return res.json(utils.JParser('Parent Update Successfully', !!parent, parent));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleParent = useAsync(async (req, res) => {

    try {
        const pid = req.params.id
        const options = {
            where: { pid }
        }

        if (!pid) return res.status(402).json(utils.JParser('id not found', false, []));

        const parent = await ModelParent.findOne(options);
        if (parent) {
            return res.json(utils.JParser('Parent fetch successfully', !!parent, parent));
        } else {
            return res.status(402).json(utils.JParser('Parent not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getParent = useAsync(async (req, res) => {

    try {
        const pid = req.pid
        const options = {
            where: { pid }
        }
    console.log(pid);
        if (!pid) return res.status(400).json(utils.JParser('id not found', false, []));

        const parent = await ModelParent.findOne(options);
        if (parent) {
            return res.json(utils.JParser('Parent fetch successfully', !!parent, parent));
        } else {
            return res.status(400).json(utils.JParser('Parent not found', false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allParent = useAsync(async (req, res) => {

    try {
        const parent = await ModelParent.findAll();
        if (!parent) return res.status(402).json(utils.JParser('Parent not found', false, []));
        return res.json(utils.JParser('All Parent fetch successfully', !!parent, parent));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteParent = useAsync(async (req, res) => {
    try {
        const pid = req.body.id
        const options = {
            where: { pid }
        }

        if (!pid) return res.status(402).json(utils.JParser('provide the parent id', false, []));

        const parent = await ModelParent.destroy(options)
        return res.json(utils.JParser('Parent deleted successfully', !!parent, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


exports.blockParent = useAsync(async (req, res) => {

    try {

        const pid = req.body.id
        if (!pid) return res.status(402).json(utils.JParser('Parent not found', false, []));

        const status = parseInt(req.params.status)
        const options = {
            where: { pid }
        }
        let body;

        if (status === 1) {
            body = { blocked: true }
        } else if (status === 2) {
            body = { blocked: false }
        }

        if (body) {
            await ModelParent.update(body, options).then(async () => {
                const parent = await ModelParent.findOne(options);
                return res.json(utils.JParser('Parent Update Successfully', !!parent, parent));
            })
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})