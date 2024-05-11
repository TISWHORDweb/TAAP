
const { errorHandle, useAsync, utils } = require('../core');
const CryptoJS = require("crypto-js");
const { ModelAdmin, ModelSchool, ModelParent } = require('../models');

//body safe state
exports.bodyParser = (req, res, next) => {
    if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
    else next();
}

//admin body guard
exports.adminBodyGuard = async (req, res, next) => {
    const xToken = req.headers['x-token'];
    if (typeof xToken == 'undefined') throw new errorHandle("Unauthorized Access, Use a valid token and try again", 401);
    //check and decode confirm code validity
    const isValid = await ModelUser.findOne({where: {token: xToken}});
    if (isValid) {
        if (isValid.whoIs === 1) next();
        else throw new errorHandle("x-token is valid but is not authorized for this route, Use a valid token and try again", 401);
    } else throw new errorHandle("Invalid x-token code or token, Use a valid token and try again", 401);
}

exports.adminBodyGuard = useAsync(async (req, res, next) => {
    const tpToken = req.headers['t-token'];

    if (tpToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const options = {
        where:{token: tpToken}
    }
    const isValid = await ModelAdmin.findOne(options);

    if (isValid) {
        //****** Decrypt Last Login Date and Time *******//
        const bytes = CryptoJS.AES.decrypt(isValid.lastLogin, process.env.SECRET_KEY);
        let lastLogin = bytes.toString(CryptoJS.enc.Utf8);

        //****** Convert to date from string *******//
        lastLogin = JSON.parse(lastLogin)
        lastLogin = new Date(lastLogin)

        //****** Calculate an hour ago in milliseconds *******//
        const oneHour = 1200 * 60 * 1000; /* ms */

        //********** Throw error if token has expired (1hr) **************//
        if (((new Date) - lastLogin) > oneHour) { res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, [])); }

        req.aid = isValid._id
        if (isValid.blocked === false) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})

exports.schoolBodyGuard = useAsync(async (req, res, next) => {
    const tpToken = req.headers['t-token'];

    if (tpToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const options = {
        where:{token: tpToken}
    }
    const isValid = await ModelSchool.findOne(options);

    if (isValid) {
        //****** Decrypt Last Login Date and Time *******//
        const bytes = CryptoJS.AES.decrypt(isValid.lastLogin, process.env.SECRET_KEY);
        let lastLogin = bytes.toString(CryptoJS.enc.Utf8);

        //****** Convert to date from string *******//
        lastLogin = JSON.parse(lastLogin)
        lastLogin = new Date(lastLogin)

        //****** Calculate an hour ago in milliseconds *******//
        const oneHour = 1200 * 60 * 1000; /* ms */

        //********** Throw error if token has expired (1hr) **************//
        if (((new Date) - lastLogin) > oneHour) { res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, [])); }

        req.sid = isValid._id
        if (isValid.blocked === false) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})

exports.parentBodyGuard = useAsync(async (req, res, next) => {
    const tpToken = req.headers['t-token'];

    if (tpToken === 'undefined') { res.status(401).json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, [])); }

    //check and decode confirm code validity
    const options = {
        where:{token: tpToken}
    }
    const isValid = await ModelParent.findOne(options);

    if (isValid) {
        //****** Decrypt Last Login Date and Time *******//
        const bytes = CryptoJS.AES.decrypt(isValid.lastLogin, process.env.SECRET_KEY);
        let lastLogin = bytes.toString(CryptoJS.enc.Utf8);

        //****** Convert to date from string *******//
        lastLogin = JSON.parse(lastLogin)
        lastLogin = new Date(lastLogin)

        //****** Calculate an hour ago in milliseconds *******//
        const oneHour = 1200 * 60 * 1000; /* ms */

        //********** Throw error if token has expired (1hr) **************//
        if (((new Date) - lastLogin) > oneHour) { res.status(401).json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, [])); }

        req.pid = isValid._id
        if (isValid.blocked === false) next();
        else return res.status(400).json(utils.JParser("token is valid but is not authorized for this route, Use a valid token and try again", false, []));
    } else res.status(400).json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
})