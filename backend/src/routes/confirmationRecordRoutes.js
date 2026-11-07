const express = require('express');
const router = express.Router();

const confirmationRecordController = require('../controllers/confirmationRecordController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateConfirmationRecordId,
  validateCreateConfirmationRecord,
  validateAdminQueryConfirmationRecords,
  validateProviderActiveCustomersQuery,
  validateRequestLeaseExtension,
  validateRespondLeaseExtension,
  validateRequestEarlyTermination,
  validateConfirmContractTermination
} = require('../validations/confirmationRecordValidation');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateCreateConfirmationRecord,
  confirmationRecordController.createConfirmationRecord
);

router.get(
  '/my-records',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyConfirmationRecords
);

router.get(
  '/provider-records',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderConfirmationRecords
);

router.get(
  '/admin/all',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateAdminQueryConfirmationRecords,
  confirmationRecordController.getAllConfirmationRecords
);

router.get(
  '/provider/active-customers',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateProviderActiveCustomersQuery,
  confirmationRecordController.getActiveCustomersAtFacility
);

router.get(
  '/extension-requests/my',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyLeaseExtensions
);

router.get(
  '/extension-requests/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderLeaseExtensions
);

router.post(
  '/extension-request',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

router.get(
  '/termination-requests/my',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  confirmationRecordController.getMyTerminationRequests
);

router.get(
  '/termination-requests/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  confirmationRecordController.getProviderTerminationRequests
);

router.post(
  '/termination-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

router.get(
  '/:id',
  authenticateToken,
  validateConfirmationRecordId,
  confirmationRecordController.getConfirmationRecordById
);

router.post(
  '/:id/extend',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

router.post(
  '/:id/extension-request',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  validateRequestLeaseExtension,
  confirmationRecordController.requestLeaseExtension
);

router.get(
  '/:id/extension-request',
  authenticateToken,
  validateConfirmationRecordId,
  confirmationRecordController.getLeaseExtensionDetail
);

router.patch(
  '/:id/extension-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  confirmationRecordController.cancelLeaseExtension
);

router.put(
  '/:id/extension-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  confirmationRecordController.cancelLeaseExtension
);

router.patch(
  '/:id/extension-request/respond',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateConfirmationRecordId,
  validateRespondLeaseExtension,
  confirmationRecordController.respondToLeaseExtension
);

router.put(
  '/:id/extension-request/respond',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateConfirmationRecordId,
  validateRespondLeaseExtension,
  confirmationRecordController.respondToLeaseExtension
);

router.post(
  '/:id/terminate-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateConfirmationRecordId,
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

router.post(
  '/:id/termination-request',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateConfirmationRecordId,
  validateRequestEarlyTermination,
  confirmationRecordController.requestEarlyTermination
);

router.get(
  '/:id/termination-request',
  authenticateToken,
  validateConfirmationRecordId,
  confirmationRecordController.getContractTerminationDetail
);

router.patch(
  '/:id/termination-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateConfirmationRecordId,
  confirmationRecordController.cancelEarlyTermination
);

router.put(
  '/:id/termination-request/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'PROVIDER'),
  validateConfirmationRecordId,
  confirmationRecordController.cancelEarlyTermination
);

router.patch(
  '/:id/terminate-confirm',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmationRecordId,
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

router.patch(
  '/:id/confirm-termination',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmationRecordId,
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

router.put(
  '/:id/confirm-termination',
  authenticateToken,
  authorizeRoles('PROVIDER', 'CUSTOMER'),
  validateConfirmationRecordId,
  validateConfirmContractTermination,
  confirmationRecordController.confirmContractTermination
);

router.patch(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  confirmationRecordController.acceptConfirmationRecord
);

router.put(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateConfirmationRecordId,
  confirmationRecordController.acceptConfirmationRecord
);

module.exports = router;
