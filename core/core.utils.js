const { ModelParent, ModelSchool, ModelAdmin } = require("../models");

class CoreError extends Error {
    constructor(msg, code) {
        super(msg);
        this.statusCode = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.CoreError = CoreError;
//json parser function
exports.JParser = (m, s, d) => ({ message: m, status: s, data: d });
//ascii code generator
exports.AsciiCodes = function generateChar(length) {
    //populate and store ascii codes
    let charArray = [];
    let code = [];
    for (let i = 33; i <= 126; i++) charArray.push(String.fromCharCode(i));
    //do range random here
    for (let i = 0; i <= length; i++) {
        code.push(charArray[Math.floor(Math.random() * charArray.length - 1)]);
    }
    return code.join("");
}

exports.checkMail = async (email) => {
    const check = { where: { email: email } }
    const admin = await ModelAdmin.findOne(check)
    const parent = await ModelParent.findOne(check)
    const school = await ModelSchool.findOne(check)

    let data

    if (parent) {
        data = parent
    } else if (admin) {
        data = admin
    } else if (school) {
        data = school
    }

    return data;
}