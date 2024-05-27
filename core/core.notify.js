

const {useAsync} = require("./index");
const path = require('path');
const {utils, errorHandle} = require("../core");
const { emailTemple } = require("../services");


exports.EmailNote = async (email, name, body, subject, code) => {
    try {
    
        await new emailTemple(email)
            .who(name)
            .body(body)
            .code(code)
            .subject(subject).send().then(r => console.log(r))
           
    } catch (e) {
        console.log("Error sending:", e);
        return e
    }
}

// exports.BulkEmailNote = async (email, name, body, subject, otp) => {
//     try {
//         await new bulkEmailTemple(email)
//             .who(name)
//             .body(body)
//             .btnText(!!otp ? otp : "")
//             .subject(subject).send().then(r => console.log(r));
//     } catch (e) {
//         console.log("Error sending:", e);
//         return e
//     }
// }