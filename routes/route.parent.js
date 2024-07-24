
const {bodyParser, parentBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const { editParent, getParent, singleParent } = require('../controllers/controller.parent');
const { getSchoolProgramById } = require('../controllers/controller.program');
const { allSchool } = require('../controllers/controller.school');
const { parentInsight, parentTransfer, singleTransaction, generatePaymentLink } = require('../controllers/controller.transaction');
//load controller and utils

/**
 * PARENT ROUTES
 */

router.put('/edit', parentBodyGuard, editParent);
router.get('/details', parentBodyGuard, getParent);
router.get('/:id', parentBodyGuard, singleParent);

/**
 * PROGRAM ROUTES 
 */
router.get('/program/school/:id', parentBodyGuard, getSchoolProgramById);

/**
 * SCHOOL ROUTES 
 */
router.get('/school/all', parentBodyGuard, allSchool);

/**
 * TRANSACTION ROUTES 
 */
router.get('/transaction/insight', parentBodyGuard, parentInsight);
router.get('/transactions', parentBodyGuard, parentTransfer);
router.get('/transaction/:id', parentBodyGuard, singleTransaction);
router.post('/transaction/payment', parentBodyGuard, generatePaymentLink);


/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})
module.exports = router;