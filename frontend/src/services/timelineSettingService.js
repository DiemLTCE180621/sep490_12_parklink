import api from './api';

const timelineSettingService = {
  async getSettings() {
    return await api.get('/timeline-settings');
  },

  async updateSettings(payload) {
    return await api.put('/timeline-settings', payload);
  }
};

export default timelineSettingService;
