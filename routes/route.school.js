
const {bodyParser, schoolBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const { editSchool, singleSchool, getSchool } = require('../controllers/controller.school');
const { createProgram, editProgram, singleProgram, getSchoolProgram, deleteProgram } = require('../controllers/controller.program');
const { schoolInsight, schoolTransfer, singleTransaction, bankTransfer, generateTrxTokenHash } = require('../controllers/controller.transaction');
const { addBank, singleBank, schoolBank, deleteBank, AllverifyBanks } = require('../controllers/controller.bank');
//load controller and utils

/**
 * SCHOOL ROUTES routes
 */

router.put('/edit', schoolBodyGuard, editSchool);
router.get('/details', schoolBodyGuard, getSchool);
router.get('/:id', schoolBodyGuard, singleSchool);

/**
 * PROGRAM ROUTES routes
 */

router.post('/program/create', schoolBodyGuard, createProgram);
router.put('/program/edit', schoolBodyGuard, editProgram);
router.get('/programs', schoolBodyGuard, getSchoolProgram);
router.get('/program/:id', schoolBodyGuard, singleProgram);
router.delete('/program/delete', schoolBodyGuard, deleteProgram);

/**
 * TRANSACTION ROUTES 
 */
router.post('/transaction/withdraw', schoolBodyGuard, bankTransfer);
router.get('/transaction/insight', schoolBodyGuard, schoolInsight);
router.get('/transactions', schoolBodyGuard, schoolTransfer);
router.get('/transaction/hash', schoolBodyGuard, generateTrxTokenHash);
router.get('/transaction/:id', schoolBodyGuard, singleTransaction);

/**
 * BANKS ROUTES 
 */
router.post('/bank/add', schoolBodyGuard, addBank);
router.delete('/bank/delete', schoolBodyGuard, deleteBank);
router.get('/single/bank', schoolBodyGuard, schoolBank);
router.get('/bank/all', schoolBodyGuard, AllverifyBanks);
router.get('/bank/:id', schoolBodyGuard, singleBank);

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})
module.exports = router;