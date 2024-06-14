
let express = require('express');
let router = express.Router();
let {errorHandle, useAsync} = require('../core');
//load middleware for admin
let { adminBodyGuard} = require('../middleware/middleware.protects');
//load controller for admin
let {index} = require('../controllers/controller.admin');
const { createSchool, singleSchool, deleteSchool, changeSchoolStatus, allSchool, blockSchool } = require('../controllers/controller.school');
const { singleParent, blockParent, deleteParent, allParent } = require('../controllers/controller.parent');
const { allTransfer, adminUserTransfer, deleteTransaction, singleTransaction, allWithraw, allDeposit } = require('../controllers/controller.transaction');

/**
 * SCHOOL ROUTES 
 */

router.get('/school/all', adminBodyGuard, allSchool);
router.delete('/school/delete', adminBodyGuard, deleteSchool);
router.put('/school/status/:status', adminBodyGuard, changeSchoolStatus);
router.put('/school/action/:status', adminBodyGuard, blockSchool);
router.get('/school/:id', adminBodyGuard, singleSchool);

/**
 * PARENT ROUTES 
 */
router.get('/parent/all', adminBodyGuard, allParent);
router.delete('/parent/delete', adminBodyGuard, deleteParent);
router.put('/parent/action/:status', adminBodyGuard, blockParent);
router.get('/parent/:id', adminBodyGuard, singleParent);

/**
 * TRANSACTION ROUTES 
 */
router.get('/transaction/all', adminBodyGuard, allTransfer);
router.get('/transaction/withdraw/all', adminBodyGuard, allWithraw);
router.get('/transaction/deposit/all', adminBodyGuard, allDeposit);
router.delete('/transaction/dalete', adminBodyGuard, deleteTransaction);
router.get('/transaction/:type/:id', adminBodyGuard, adminUserTransfer);
router.get('/transaction/:id', adminBodyGuard, singleTransaction);

/* GET statistics data. */
router.get('/stats', useAsync(adminBodyGuard), useAsync(index));

module.exports = router;