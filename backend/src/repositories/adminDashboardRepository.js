const prisma = require("../config/prisma");

class AdminDashboardRepository {
  async getOverview() {
    const [
      totalUsers,
      activeFacilities,
      pendingFacilities,
      totalReservations,
      pendingComplaints,
      paidPlatformFees,
      monthlyActivity,
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
      prisma.complaint.count({ where: { status: "PENDING_ADMIN" } }),
      prisma.facility.aggregate({
        where: { payment_status: "PAID" },
        _sum: { system_fee: true },
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
          SELECT date_trunc('month', created_at), 'complaints'
          FROM complaints
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
        ),
        activity_counts AS (
          SELECT
            month_start,
            COUNT(*) FILTER (WHERE type = 'facilities')::int AS facilities,
            COUNT(*) FILTER (WHERE type = 'reservations')::int AS reservations,
            COUNT(*) FILTER (WHERE type = 'complaints')::int AS complaints
          FROM activity
          GROUP BY month_start
        ),
        paid_fees AS (
          SELECT
            date_trunc('month', created_at) AS month_start,
            SUM(system_fee) / 100 AS amount
          FROM facilities
          WHERE payment_status = 'PAID'
            AND created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months'
          GROUP BY date_trunc('month', created_at)
        )
        SELECT
          to_char(months.month_start, 'YYYY-MM') AS month,
          COALESCE(activity_counts.facilities, 0) AS facilities,
          COALESCE(activity_counts.reservations, 0) AS reservations,
          COALESCE(activity_counts.complaints, 0) AS complaints,
          COALESCE(paid_fees.amount, 0)::double precision AS platform_fees
        FROM months
        LEFT JOIN activity_counts ON activity_counts.month_start = months.month_start
        LEFT JOIN paid_fees ON paid_fees.month_start = months.month_start
        ORDER BY months.month_start
      `,
    ]);

    return {
      totalUsers,
      activeFacilities,
      pendingFacilities,
      totalReservations,
      pendingComplaints,
      paidPlatformFees: Number(paidPlatformFees._sum.system_fee || 0) / 100,
      monthlyActivity,
    };
  }
}

module.exports = new AdminDashboardRepository();
