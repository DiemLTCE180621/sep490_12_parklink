const express = require('express');
const router = express.Router();
const fieldInspectorController = require('../controllers/fieldInspectorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateFieldInspector,
  validateUpdateFieldInspector
} = require('../validations/fieldInspectorValidation');

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.post('/', validateCreateFieldInspector, fieldInspectorController.createFieldInspector);
router.get('/', fieldInspectorController.getFieldInspectors);
router.get('/active', fieldInspectorController.getActiveInspectors);
router.put('/:id', validateUpdateFieldInspector, fieldInspectorController.updateFieldInspector);

module.exports = router;
