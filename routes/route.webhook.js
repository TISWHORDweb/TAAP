
const {webHookBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const { webHook } = require('../controllers/controller.webhook');
//load controller and utils

/**
 * WEBHOOK ROUTES
 */

router.post('/', webHookBodyGuard, webHook);

router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})
module.exports = router;