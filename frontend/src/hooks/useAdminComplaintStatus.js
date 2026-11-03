import { useState, useCallback } from 'react';
import complaintService from '../services/complaintService';
import { validateUpdateComplaintStatus } from '../validations/complaintValidation';

/**
 * Custom Hook quản lý tác vụ Admin cập nhật trạng thái khiếu nại
 * Tối ưu hóa hiệu năng, tách biệt hoàn toàn business logic và UI
 */
export const useAdminComplaintStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (complaintId, { status, note }) => {
    // 1. Client-side Validation
    const validation = validateUpdateComplaintStatus({ status, note });
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      throw new Error(firstError);
    }

    try {
      setLoading(true);
      setError(null);

      // 2. Gọi API Backend (Endpoint dành riêng cho Admin)
      const res = await complaintService.updateComplaintStatusByAdmin(complaintId, {
        status,
        note: note ? note.trim() : undefined
      });

      const updatedComplaint = res.data?.complaint || res.data || res;
      return updatedComplaint;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Lỗi khi cập nhật trạng thái khiếu nại!';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    updateStatus,
    clearError
  };
};

export default useAdminComplaintStatus;

