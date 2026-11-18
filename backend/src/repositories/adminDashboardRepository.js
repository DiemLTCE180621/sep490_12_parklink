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
}

module.exports = new AdminDashboardRepository();
