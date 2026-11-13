const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { validateUpdatePolicy } = require('../validations/policyValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/admin/all', authenticateToken, authorizeRoles('ADMIN'), policyController.getAllPoliciesAdmin);

router.put('/admin/:id', authenticateToken, authorizeRoles('ADMIN'), validateUpdatePolicy, policyController.updatePolicy);

router.get('/', policyController.getActivePolicies);

router.get('/:identifier', policyController.getPolicyByTypeOrId);

module.exports = router;
