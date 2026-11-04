const prisma = require('../config/prisma');

class PolicyRepository {
  
  async findActivePolicies() {
    return await prisma.system_Policy.findMany({
      where: { is_active: true },
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
  }

  async findAllPolicies() {
    return await prisma.system_Policy.findMany({
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
  }

  async findByType(policy_type) {
    return await prisma.system_Policy.findUnique({
      where: { policy_type },
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

  async findById(id) {
    return await prisma.system_Policy.findUnique({
      where: { id: parseInt(id, 10) },
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

  async updatePolicy(id, updateData) {
    return await prisma.system_Policy.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
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

  async createPolicy(policyData) {
    return await prisma.system_Policy.create({
      data: policyData,
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

module.exports = new PolicyRepository();
