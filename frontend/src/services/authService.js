import api from './api';

const authService = {
  
  async getAmenities() {
    return await api.get('/auth/amenities');
  },

  async getVehicleTypes() {
    return await api.get('/vehicle-types/active');
  },

  async getContactInfo() {
    return await api.get('/auth/contact-info');
  },

  async registerCustomer(customerData) {
    return await api.post('/auth/register/customer', customerData);
  },

  async registerProvider(providerData) {
    return await api.post('/auth/register/provider', providerData);
  },

  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  async googleLogin(credential) {
    return await api.post('/auth/google-login', { credential });
  },

  async changePassword(passwordData) {
    return await api.post('/auth/change-password', passwordData);
  },
  
  async requestPasswordReset(email) {
    return await api.post('/auth/forgot-password/request', { email });
  },

  async verifyAndResetPassword({ email, otpCode, newPassword }) {
    return await api.post('/auth/forgot-password/verify-reset', { email, otpCode, newPassword });
  },
  
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Lỗi khi gọi API logout:', e);
    } finally {
      localStorage.removeItem('parklink_token');
    }
  },

  async getCurrentUser() {
    return await api.get('/auth/me');
  },

  async getProfile() {
    return await api.get('/auth/profile');
  },

  async updateProfile(profileData) {
    return await api.put('/auth/profile', profileData);
  }
};

export default authService;
