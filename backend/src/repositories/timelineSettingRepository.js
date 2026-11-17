const prisma = require('../config/prisma');

const DEFAULT_TIMELINES = {
  reservation_response_value: 12,
  reservation_response_unit: 'HOURS',
  contract_creation_value: 24,
  contract_creation_unit: 'HOURS',
  contract_signing_value: 24,
  contract_signing_unit: 'HOURS',
  termination_notice_value: 15,
  termination_notice_unit: 'DAYS'
};

class TimelineSettingRepository {
  async getSettings() {
    let settings = await prisma.system_Timeline_Setting.findFirst({
      orderBy: { id: 'asc' },
      include: {
        admin: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!settings) {
      settings = await prisma.system_Timeline_Setting.create({
        data: DEFAULT_TIMELINES,
        include: {
          admin: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          }
        }
      });
    }

    return settings;
  }

  async updateSettings(updateData, adminId) {
    const existing = await this.getSettings();

    const data = {
      updated_by: adminId ? parseInt(adminId, 10) : existing.updated_by
    };

    if (updateData.reservation_response_value !== undefined) {
      data.reservation_response_value = parseFloat(updateData.reservation_response_value);
    }
    if (updateData.reservation_response_unit !== undefined) {
      data.reservation_response_unit = updateData.reservation_response_unit.toUpperCase();
    }

    if (updateData.contract_creation_value !== undefined) {
      data.contract_creation_value = parseFloat(updateData.contract_creation_value);
    }
    if (updateData.contract_creation_unit !== undefined) {
      data.contract_creation_unit = updateData.contract_creation_unit.toUpperCase();
    }

    if (updateData.contract_signing_value !== undefined) {
      data.contract_signing_value = parseFloat(updateData.contract_signing_value);
    }
    if (updateData.contract_signing_unit !== undefined) {
      data.contract_signing_unit = updateData.contract_signing_unit.toUpperCase();
    }

    if (updateData.termination_notice_value !== undefined) {
      data.termination_notice_value = parseFloat(updateData.termination_notice_value);
    }
    if (updateData.termination_notice_unit !== undefined) {
      data.termination_notice_unit = updateData.termination_notice_unit.toUpperCase();
    }

    return await prisma.system_Timeline_Setting.update({
      where: { id: existing.id },
      data,
      include: {
        admin: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });
  }
}

module.exports = new TimelineSettingRepository();
