const prisma = require('../config/prisma');

class ReviewRepository {

  async getReviewsByFacilityId(facility_id) {
    return await prisma.review.findMany({
      where: {
        facility_id: parseInt(facility_id),
        status: 'VISIBLE'
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async getReviewById(review_id) {
    return await prisma.review.findUnique({
      where: { id: parseInt(review_id) }
    });
  }

  async getReviewWithFacility(review_id) {
    return await prisma.review.findUnique({
      where: { id: parseInt(review_id) },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true
          }
        },
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });
  }

  async getReviewByCustomerAndFacility(customer_id, facility_id) {
    return await prisma.review.findFirst({
      where: {
        customer_id: parseInt(customer_id),
        facility_id: parseInt(facility_id)
      }
    });
  }

  async createReview(data) {
    return await prisma.review.create({
      data: {
        customer_id: parseInt(data.customer_id),
        facility_id: parseInt(data.facility_id),
        rating: parseInt(data.rating),
        comment: data.comment,
        status: data.status ? data.status : (data.is_flagged ? 'HIDDEN' : 'VISIBLE'),
        is_flagged: data.is_flagged ?? false,
        flagged_reason: data.flagged_reason ?? null
      }
    });
  }

  async updateReview(review_id, data) {
    const updateData = {};
    if (data.rating !== undefined) updateData.rating = parseInt(data.rating);
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_flagged !== undefined) updateData.is_flagged = data.is_flagged;
    if (data.flagged_reason !== undefined) updateData.flagged_reason = data.flagged_reason;

    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: updateData
    });
  }

  async replyReview(review_id, provider_reply) {
    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: {
        provider_reply: provider_reply
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            provider_id: true
          }
        }
      }
    });
  }

  async updateReviewStatus(review_id, data) {
    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_flagged !== undefined) updateData.is_flagged = data.is_flagged;
    if (data.flagged_reason !== undefined) updateData.flagged_reason = data.flagged_reason;

    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: updateData
    });
  }

  /**
   * Admin Unhide review gỡ cờ cảnh báo)
   */
  async unhideReview(review_id) {
    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: {
        status: 'VISIBLE',
        is_flagged: false,
        flagged_reason: null
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            provider_id: true
          }
        }
      }
    });
  }

  async deleteReview(review_id) {
    return await prisma.review.delete({
      where: { id: parseInt(review_id) }
    });
  }

  async checkCustomerContract(customer_id, facility_id) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customer_id),
        facility_id: parseInt(facility_id),
        confirmation_record: {
          isNot: null
        }
      },
      include: {
        confirmation_record: true
      }
    });
  }

  async getAllReviewsAdmin() {
    return await prisma.review.findMany({
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async getProviderReviews(provider_id) {
    return await prisma.review.findMany({
      where: {
        facility: {
          provider_id: parseInt(provider_id)
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
}

module.exports = new ReviewRepository();
