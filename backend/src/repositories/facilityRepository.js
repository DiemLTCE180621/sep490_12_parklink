const prisma = require("../config/prisma");

/**
 * Repository thao tác trực tiếp với bảng Facility trong Database
 */
class FacilityRepository {
  /**
   * Lấy danh sách các bãi đỗ xe đang chờ duyệt HOẶC đang chuẩn bị
   * (kèm thông tin Provider và Hình ảnh)
   */
  async findPendingFacilities() {
    return await prisma.facility.findMany({
      where: {
        verification_status: {
          in: ["PENDING_REVIEW", "PREPARING", "INSPECTED"],
        },
      },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            status: true,
          },
        },
        assigned_inspector: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
          },
        },
        images: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  /**
   * Tìm bãi đỗ xe cụ thể theo ID (kèm Provider)
   * @param {number} id - ID của bãi đỗ xe
   */
  async findById(id) {
    return await prisma.facility.findUnique({
      where: { id },
      include: {
        provider: true,
        assigned_inspector: {
          select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            address: true,
            status: true,
          },
        },
        images: true,
        facility_amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });
  }

  /**
   * Lấy facility theo provider_id
   */
  async getFacilityByProviderId(providerId) {
    return await prisma.facility.findUnique({
      where: { provider_id: providerId },
    });
  }

  /**
   * Bước 1: Duyệt sơ bộ → PREPARING & Phân công Nhân viên khảo sát
   * Admin xác nhận duyệt sơ bộ và chỉ định nhân viên khảo sát thực địa.
   * @param {number} facilityId
   * @param {number} providerId
   * @param {number|null} inspectorId - ID Nhân viên khảo sát được phân công
   */
  async prepareFacility(facilityId, providerId, inspectorId = null) {
    return await prisma.$transaction(async (tx) => {
      const updateData = {
        verification_status: "PREPARING",
        visibility_status: "HIDDEN",
      };
      if (inspectorId) {
        updateData.assigned_inspector_id = inspectorId;
      }

      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: updateData,
        include: {
          provider: true,
          assigned_inspector: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone_number: true,
            },
          },
        },
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: "Cơ sở đang được chuẩn bị & khảo sát",
          content: `Yêu cầu đăng ký cơ sở "${facility.name}" đã được duyệt sơ bộ. Đội ngũ kỹ thuật ParkLink sẽ sớm liên hệ và đến khảo sát thực địa.`,
          type: "SYSTEM",
        },
      });

      // Tạo Notification cho Nhân viên khảo sát được phân công
      if (inspectorId) {
        await tx.notification.create({
          data: {
            user_id: inspectorId,
            title: "Nhiệm vụ khảo sát thực địa mới",
            content: `Bạn đã được phân công khảo sát cơ sở "${facility.name}" tại: ${facility.address}. Vui lòng liên hệ chủ bãi và thực hiện kiểm tra thực địa.`,
            type: "SYSTEM",
          },
        });
      }

      return facility;
    });
  }

  /**
   * Phân công hoặc thay đổi Nhân viên khảo sát thực địa cho cơ sở
   * @param {number} facilityId
   * @param {number} inspectorId
   */
  async assignInspector(facilityId, inspectorId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          assigned_inspector_id: inspectorId,
          verification_status: "PREPARING",
          visibility_status: "HIDDEN",
        },
        include: {
          provider: true,
          assigned_inspector: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone_number: true,
            },
          },
        },
      });

      // Tạo Notification cho Nhân viên khảo sát được phân công
      await tx.notification.create({
        data: {
          user_id: inspectorId,
          title: "Nhiệm vụ khảo sát thực địa mới",
          content: `Bạn đã được phân công khảo sát cơ sở "${facility.name}" tại: ${facility.address}. Vui lòng liên hệ chủ bãi và thực hiện kiểm tra thực địa.`,
          type: "SYSTEM",
        },
      });

      return facility;
    });
  }

  /**
   * Bước 2: Xác nhận hoàn tất → APPROVED
   * Admin đã chuẩn bị xong, cơ sở chính thức được duyệt, chờ Provider thanh toán.
   * @param {number} facilityId
   * @param {number} providerId
   */
  async approveFacility(facilityId, providerId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          verification_status: "APPROVED",
          visibility_status: "HIDDEN", // Ẩn đến khi Provider thanh toán
          payment_status: "UNPAID",
        },
      });

      // Kích hoạt tài khoản Provider
      await tx.user.update({
        where: { id: providerId },
        data: { status: "ACTIVE" },
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: "Cơ sở đã được phê duyệt - Vui lòng thanh toán",
          content: `Cơ sở "${facility.name}" đã được phê duyệt! Vui lòng đăng nhập và hoàn tất thanh toán phí nền tảng để cơ sở được hiển thị công khai.`,
          type: "SYSTEM",
        },
      });

      return facility;
    });
  }

  /**
   * Bước 3: Provider xác nhận thanh toán → payment_status: PAID → VISIBLE
   * @param {number} facilityId
   * @param {number} providerId
   */
  async confirmPayment(facilityId, providerId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          payment_status: "PAID",
          visibility_status: "VISIBLE",
        },
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: "Thanh toán thành công - Cơ sở đã được công khai!",
          content: `Cơ sở "${facility.name}" đã được thanh toán và hiện đang hiển thị công khai trên nền tảng ParkLink. Chúc bạn kinh doanh thuận lợi!`,
          type: "SYSTEM",
        },
      });

      return facility;
    });
  }

  /**
   * Nhân viên khảo sát thực địa gửi dữ liệu hình ảnh và số chỗ (capacity)
   * @param {number} facilityId
   * @param {number} capacity
   * @param {string[]} images
   */
  async inspectFacility(facilityId, capacity, images = []) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          capacity: parseInt(capacity, 10),
          available_slots: parseInt(capacity, 10),
          verification_status: "INSPECTED",
        },
      });

      if (images && images.length > 0) {
        await tx.facility_Image.createMany({
          data: images.map((url, idx) => ({
            facility_id: facilityId,
            image_url: url,
            is_primary: idx === 0,
          })),
        });
      }

      return facility;
    });
  }

  /**
   * Lấy danh sách bãi đỗ xe đang PREPARING cho Field Inspector
   * Chỉ nhân viên được phân công mới nhận được công việc này
   * @param {number} inspectorId - ID Nhân viên khảo sát phụ trách
   */
  async findPreparingFacilities(inspectorId) {
    if (!inspectorId) return [];

    const where = {
      verification_status: "PREPARING",
      assigned_inspector_id: inspectorId,
    };

    return await prisma.facility.findMany({
      where,
      include: {
        provider: {
          select: {
            full_name: true,
            phone_number: true,
            email: true,
          },
        },
        assigned_inspector: {
          select: {
            id: true,
            full_name: true,
            phone_number: true,
            email: true,
          },
        },
      },
      orderBy: {
        updated_at: "desc",
      },
    });
  }

  /**
   * Cập nhật trạng thái từ chối Bãi đỗ xe thành REJECTED (dùng Transaction)
   * Kèm theo việc tạo Notification ghi nhận lý do từ chối
   * @param {number} facilityId - ID của bãi đỗ xe
   * @param {number} providerId - ID của chủ bãi (User)
   * @param {string} reason - Lý do từ chối
   */
  async rejectFacility(
    facilityId,
    providerId,
    reason = "Hồ sơ bãi đỗ xe không đạt yêu cầu của ParkLink.",
  ) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          verification_status: "REJECTED",
          visibility_status: "HIDDEN",
        },
      });

      await tx.user.update({
        where: { id: providerId },
        data: { status: "REJECTED" },
      });

      await tx.notification.create({
        data: {
          user_id: providerId,
          title: "Đăng ký bãi đỗ xe bị từ chối",
          content: `Yêu cầu đăng ký cơ sở "${facility.name}" của bạn đã bị từ chối. Lý do: ${reason}`,
          type: "SYSTEM",
        },
      });

      return facility;
    });
  }

  /**
   * Tìm kiếm bãi đỗ xe ACTIVE dựa theo từ khóa, loại xe và tiện ích
   */
  async searchActiveFacilities({ keyword, vehicle_type, amenities }) {
    let whereClause = {
      verification_status: "APPROVED",
      visibility_status: "VISIBLE",
    };

    if (keyword) {
      const normalizedKeyword = keyword.trim().replace(/\s+/g, " ");
      const locationVariants = new Set([normalizedKeyword]);
      const cityPrefixPattern = /^(?:thành phố|tp\.?|t\.p\.?)\s+/i;
      const withoutCityPrefix = normalizedKeyword.replace(cityPrefixPattern, "").trim();

      if (withoutCityPrefix && withoutCityPrefix !== normalizedKeyword) {
        locationVariants.add(withoutCityPrefix);
      }

      const cityMatches = normalizedKeyword.matchAll(
        /(?:thành phố|tp\.?|t\.p\.?)\s+([^,]+)/gi,
      );
      for (const match of cityMatches) {
        const cityName = match[1].trim();
        if (cityName) locationVariants.add(cityName);
      }

      const keywordVariants = [...locationVariants];
      whereClause.OR = [
        ...keywordVariants.flatMap((variant) => [
          { name: { contains: variant, mode: "insensitive" } },
          { address: { contains: variant, mode: "insensitive" } },
        ]),
      ];
    }

    let facilities = await prisma.facility.findMany({
      where: whereClause,
      include: {
        images: true,
        facility_amenities: {
          include: {
            amenity: true,
          },
        },
        reviews: {
          where: { status: "VISIBLE" },
          select: { rating: true },
        },
      },
    });

    // Lọc thủ công theo vehicle_type nếu database lưu vehicle_types dưới dạng mảng JSON hoặc String
    if (vehicle_type) {
      facilities = facilities.filter((f) => {
        if (!f.vehicle_types) return false;
        // Kiểm tra xem chuỗi JSON hoặc array có chứa vehicle_type không
        try {
          const types =
            typeof f.vehicle_types === "string"
              ? JSON.parse(f.vehicle_types)
              : f.vehicle_types;
          return Array.isArray(types) && types.includes(vehicle_type);
        } catch (e) {
          // Fallback if it's just a comma separated string or simple string
          return f.vehicle_types.includes(vehicle_type);
        }
      });
    }

    // Lọc theo tiện ích (Logical AND: phải có tất cả các tiện ích được chọn)
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      facilities = facilities.filter((f) => {
        const facilityAmenityIds = f.facility_amenities.map(
          (fa) => fa.amenity_id,
        );
        return amenities.every((amenityId) =>
          facilityAmenityIds.includes(parseInt(amenityId)),
        );
      });
    }

    return facilities;
  }

  /**
   * Lấy danh sách tất cả các tiện ích
   */
  async getAllAmenities() {
    return await prisma.amenity.findMany({
      orderBy: { id: "asc" },
    });
  }

  /**
   * Admin lấy danh sách tất cả các cơ sở bãi đỗ xe trong hệ thống
   */
  async findAllFacilities() {
    return await prisma.facility.findMany({
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            status: true,
          },
        },
        images: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  /**
   * Khóa / Mở khóa bãi đỗ xe (Chuyển đổi visibility_status giữa VISIBLE và HIDDEN,
   * có thể đi kèm logic đổi trạng thái khác nếu cần, ở đây chỉ đổi VISIBLE <-> HIDDEN cho chức năng Khóa)
   */
  async toggleLockFacility(facilityId) {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });

    // Nếu đang VISIBLE thì chuyển thành HIDDEN (Khóa)
    // Nếu đang HIDDEN thì chuyển thành VISIBLE (Mở khóa)
    // Tuy nhiên chỉ cho phép khóa mở khóa khi bãi đã APPROVED và PAID
    if (facility.verification_status !== "APPROVED") {
      throw Object.assign(
        new Error("Chỉ có thể khóa/mở khóa bãi đỗ xe đã được phê duyệt!"),
        { status: 400 },
      );
    }

    const newVisibility =
      facility.visibility_status === "VISIBLE" ? "HIDDEN" : "VISIBLE";

    return await prisma.facility.update({
      where: { id: facilityId },
      data: {
        visibility_status: newVisibility,
      },
    });
  }

  /**
   * Cập nhật thông tin cơ bản của bãi đỗ xe
   */
  async updateFacility(facilityId, updateData) {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });

    return await prisma.facility.update({
      where: { id: facilityId },
      data: {
        name: updateData.name !== undefined ? updateData.name : undefined,
        address:
          updateData.address !== undefined ? updateData.address : undefined,
        latitude:
          updateData.latitude !== undefined
            ? updateData.latitude === "" || updateData.latitude === null
              ? null
              : parseFloat(updateData.latitude)
            : undefined,
        longitude:
          updateData.longitude !== undefined
            ? updateData.longitude === "" || updateData.longitude === null
              ? null
              : parseFloat(updateData.longitude)
            : undefined,
        capacity:
          updateData.capacity !== undefined
            ? parseInt(updateData.capacity, 10)
            : undefined,
        available_slots:
          updateData.available_slots !== undefined
            ? parseInt(updateData.available_slots, 10)
            : undefined,
        price_per_month:
          updateData.price_per_month !== undefined
            ? parseFloat(updateData.price_per_month)
            : undefined,
        system_fee:
          updateData.system_fee !== undefined
            ? parseFloat(updateData.system_fee)
            : undefined,
        visibility_status:
          updateData.visibility_status !== undefined
            ? updateData.visibility_status
            : undefined,
      },
    });
  }

  /**
   * Lấy chi tiết đầy đủ nhiều bãi đỗ xe theo danh sách ID để phục vụ so sánh.
   * Chỉ lấy các bãi có trạng thái APPROVED và VISIBLE (ACTIVE).
   * @param {number[]} ids - Mảng ID các bãi đỗ xe cần so sánh (2–4 phần tử)
   */
  async findByIdsForCompare(ids) {
    return await prisma.facility.findMany({
      where: {
        id: { in: ids },
        verification_status: "APPROVED",
        visibility_status: "VISIBLE",
      },
      include: {
        images: true,
        facility_amenities: {
          include: {
            amenity: true,
          },
        },
        // Lấy reviews để tính rating trung bình
        reviews: {
          where: { status: "VISIBLE" },
          select: {
            rating: true,
          },
        },
      },
    });
  }

  /**
   * UC-41: Lấy thông tin chi tiết của bãi đỗ xe
   */
  async getFacilityDetails(id) {
    return await prisma.facility.findUnique({
      where: { 
        id,
        verification_status: "APPROVED",
        visibility_status: "VISIBLE"
      },
      include: {
        provider: {
          select: { id: true, full_name: true, email: true, phone_number: true }
        },
        images: true,
        facility_amenities: {
          include: { amenity: true }
        },
        reviews: {
          where: { status: "VISIBLE" },
          include: {
            customer: { select: { full_name: true } }
          },
          orderBy: { created_at: "desc" }
        }
      }
    });
  }

  /**
   * UC-42: Đếm số lượng hợp đồng (xe) đang gửi tại bãi
   */
  async getActiveContractsCount(facilityId) {
    return await prisma.confirmation_Record.count({
      where: {
        reservation: { facility_id: facilityId },
        status: "ACTIVE"
      }
    });
  }
}

module.exports = new FacilityRepository();
