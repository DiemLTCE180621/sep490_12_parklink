const prisma = require("../config/prisma");

class AdminDashboardRepository {
  async getOverview() {
    const [
      totalUsers,
      activeFacilities,
      pendingFacilities,
      totalReservations,
      totalContracts,
      pendingComplaints,
      paidPlatformFees,
      monthlyActivity,
      platformFeeMonths,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.facility.count({
        where: {
          verification_status: "APPROVED",
          visibility_status: "VISIBLE",
        },
      }),
      prisma.facility.count({
        where: {
          verification_status: {
            in: ["PENDING_REVIEW", "PREPARING", "INSPECTED"],
          },
        },
      }),
      prisma.reservation_Request.count(),
      prisma.confirmation_Record.count(),
      prisma.complaint.count({ where: { status: { in: ["PENDING_ADMIN", "PENDING", "OPEN"] } } }),
      prisma.system_Transaction.aggregate({
        where: { transaction_type: "PLATFORM_FEE", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.$queryRaw`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months',
            date_trunc('month', CURRENT_TIMESTAMP),
            INTERVAL '1 month'
          ) AS month_start
        ),
        activity AS (
          SELECT date_trunc('month', created_at) AS month_start, 'facilities' AS type
          FROM facilities
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
          UNION ALL
          SELECT date_trunc('month', created_at), 'reservations'
          FROM reservation_requests
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
          UNION ALL
          SELECT date_trunc('month', created_at), 'contracts'
          FROM confirmation_records
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
          UNION ALL
          SELECT date_trunc('month', created_at), 'complaints'
          FROM complaints
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
        ),
        activity_counts AS (
          SELECT
            month_start,
            COUNT(*) FILTER (WHERE type = 'facilities')::int AS facilities,
            COUNT(*) FILTER (WHERE type = 'reservations')::int AS reservations,
            COUNT(*) FILTER (WHERE type = 'contracts')::int AS contracts,
            COUNT(*) FILTER (WHERE type = 'complaints')::int AS complaints
          FROM activity
          GROUP BY month_start
        )
        SELECT
          to_char(months.month_start, 'YYYY-MM') AS month,
          COALESCE(activity_counts.facilities, 0) AS facilities,
          COALESCE(activity_counts.reservations, 0) AS reservations,
          COALESCE(activity_counts.contracts, 0) AS contracts,
          COALESCE(activity_counts.complaints, 0) AS complaints
        FROM months
        LEFT JOIN activity_counts ON activity_counts.month_start = months.month_start
        ORDER BY months.month_start
      `,
      prisma.$queryRaw`
        SELECT
          to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
          SUM(amount)::double precision AS platform_fees
        FROM system_transactions
        WHERE transaction_type = 'PLATFORM_FEE'
          AND status = 'COMPLETED'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
      `,
    ]);

    return {
      totalUsers,
      activeFacilities,
      pendingFacilities,
      totalReservations,
      totalContracts,
      pendingComplaints,
      paidPlatformFees: Number(paidPlatformFees._sum.amount || 0),
      monthlyActivity,
      platformFeeMonths,
    };
  }

  async getPlatformFeeTransactionsByMonth(month) {
    return prisma.$queryRaw`
      SELECT
        st.id,
        st.amount::double precision AS amount,
        st.created_at,
        facility.id AS facility_id,
        facility.name AS facility_name,
        provider.full_name AS provider_name
      FROM system_transactions AS st
      JOIN facilities AS facility ON facility.id = st.facility_id
      JOIN users AS provider ON provider.id = st.provider_id
      WHERE st.transaction_type = 'PLATFORM_FEE'
        AND st.status = 'COMPLETED'
        AND to_char(date_trunc('month', st.created_at), 'YYYY-MM') = ${month}
      ORDER BY st.created_at DESC, st.id DESC
    `;
  }

  async getRevenueData({ fromDate, toDate, facilityId }) {
    const txWhere = {};
    if (facilityId) txWhere.facility_id = Number(facilityId);
    if (fromDate || toDate) {
      txWhere.created_at = {};
      if (fromDate) txWhere.created_at.gte = fromDate;
      if (toDate) txWhere.created_at.lte = toDate;
    }

    const contractWhere = {
      status: { in: ["ACTIVE", "TERMINATED", "CANCELLED"] }
    };
    if (facilityId) contractWhere.reservation = { facility_id: Number(facilityId) };
    if (fromDate || toDate) {
      contractWhere.created_at = {};
      if (fromDate) contractWhere.created_at.gte = fromDate;
      if (toDate) contractWhere.created_at.lte = toDate;
    }

    const facWhere = {};
    if (facilityId) facWhere.id = Number(facilityId);

    const [transactions, contracts, facilities] = await Promise.all([
      prisma.system_Transaction.findMany({
        where: txWhere,
        select: {
          id: true,
          amount: true,
          transaction_type: true,
          status: true,
          created_at: true,
          facility: { select: { id: true, name: true, address: true } },
          provider: { select: { id: true, full_name: true, email: true, phone_number: true } }
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }]
      }),
      prisma.confirmation_Record.findMany({
        where: contractWhere,
        select: {
          id: true,
          contract_code: true,
          agreed_price: true,
          start_date: true,
          end_date: true,
          status: true,
          created_at: true,
          reservation: {
            select: {
              vehicle_info: true,
              customer: { select: { full_name: true, phone_number: true, email: true } },
              facility: {
                select: {
                  name: true,
                  provider: { select: { full_name: true } }
                }
              }
            }
          }
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }]
      }),
      prisma.facility.findMany({
        where: facWhere,
        select: {
          id: true,
          name: true,
          address: true,
          capacity: true,
          available_slots: true,
          payment_status: true,
          provider: { select: { full_name: true } },
          transactions: {
            where: { status: "COMPLETED" },
            select: { amount: true }
          },
          reservations: {
            where: { confirmation_record: { status: "ACTIVE" } },
            select: {
              confirmation_record: { select: { agreed_price: true } }
            }
          }
        },
        orderBy: { id: "asc" }
      })
    ]);

    return { transactions, contracts, facilities };
  }
}

module.exports = new AdminDashboardRepository();
