
const {bodyParser} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
//load controller and utils
const {index, authLogin, authRegister, authReset, authParentRegister, authSchoolRegister, authAdminRegister, authVerifyEmail, authVerify, authResetPassword} = require('./../controllers/controller.auth');
/**
 * auth routes
 */
router.get('/', index);
router.post('/login', bodyParser, authLogin);
router.post('/parent/register', bodyParser, authParentRegister);
router.post('/school/register', bodyParser, authSchoolRegister);
router.post('/admin/register', bodyParser, authAdminRegister);
router.post('/reset', bodyParser, authReset);
router.post('/verify/email', bodyParser, authVerifyEmail);
router.post('/reset/verify', bodyParser, authVerify);
router.post('/reset/password', bodyParser, authResetPassword);

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})
module.exports = router;