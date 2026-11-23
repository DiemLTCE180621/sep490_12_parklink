const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateUserId, validateUpdateUser } = require('../validations/userValidation');

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', userController.getUsers);
router.get('/:id', validateUserId, userController.getUserById);
router.put('/:id', validateUserId, validateUpdateUser, userController.updateUser);
router.post('/:id/reset-password', validateUserId, userController.forceResetPassword);
router.put('/:id/toggle-status', validateUserId, userController.toggleUserStatus);

module.exports = router;
