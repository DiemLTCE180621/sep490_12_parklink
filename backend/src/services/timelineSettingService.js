const timelineSettingRepository = require('../repositories/timelineSettingRepository');

class TimelineSettingService {
  toMilliseconds(value, unit) {
    const num = Math.max(0.1, parseFloat(value) || 1);
    const upperUnit = (unit || 'HOURS').toUpperCase();

    switch (upperUnit) {
      case 'MINUTES':
        return Math.round(num * 60 * 1000);
      case 'DAYS':
        return Math.round(num * 24 * 60 * 60 * 1000);
      case 'HOURS':
      default:
        return Math.round(num * 60 * 60 * 1000);
    }
  }

  formatTimeLabel(value, unit) {
    const num = parseFloat(value) || 0;
    const upperUnit = (unit || 'HOURS').toUpperCase();

    switch (upperUnit) {
      case 'MINUTES':
        return `${num} phút`;
      case 'DAYS':
        return `${num} ngày`;
      case 'HOURS':
      default:
        return `${num} giờ`;
    }
  }

  async getTimelineSettings() {
    const settings = await timelineSettingRepository.getSettings();

    const reservationResponseMs = this.toMilliseconds(
      settings.reservation_response_value,
      settings.reservation_response_unit
    );
    const reservationResponseText = this.formatTimeLabel(
      settings.reservation_response_value,
      settings.reservation_response_unit
    );

    const contractCreationMs = this.toMilliseconds(
      settings.contract_creation_value,
      settings.contract_creation_unit
    );
    const contractCreationText = this.formatTimeLabel(
      settings.contract_creation_value,
      settings.contract_creation_unit
    );

    const contractSigningMs = this.toMilliseconds(
      settings.contract_signing_value,
      settings.contract_signing_unit
    );
    const contractSigningText = this.formatTimeLabel(
      settings.contract_signing_value,
      settings.contract_signing_unit
    );

    const terminationNoticeMs = this.toMilliseconds(
      settings.termination_notice_value,
      settings.termination_notice_unit
    );
    const terminationNoticeText = this.formatTimeLabel(
      settings.termination_notice_value,
      settings.termination_notice_unit
    );

    return {
      settings,
      calculated: {
        reservationResponseMs,
        reservationResponseText,
        contractCreationMs,
        contractCreationText,
        contractSigningMs,
        contractSigningText,
        terminationNoticeMs,
        terminationNoticeText
      }
    };
  }

  async updateTimelineSettings(updateData, adminUser) {
    const adminId = adminUser?.userId || adminUser?.id;
    const updatedSettings = await timelineSettingRepository.updateSettings(updateData, adminId);
    return await this.getTimelineSettings();
  }
}

module.exports = new TimelineSettingService();
