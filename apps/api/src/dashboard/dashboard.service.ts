// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  private getLast30DaysRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end };
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────

  async getAdminDashboard() {
    const today = this.getTodayRange();
    const month = this.getMonthRange();
    const last30 = this.getLast30DaysRange();

    const [
      salesToday,
      expensesToday,
      salesThisMonth,
      expensesThisMonth,
      ordersByStatus,
      topMenuItems,
      lowStockMaterials,
      recentOrders,
      salesBySalesman,
      purchasesThisMonth,
      dailyRevenueLast30,
    ] = await Promise.all([
      // Today's completed sales
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, updatedAt: { gte: today.start, lt: today.end } },
        _sum: { totalAmount: true },
      }),

      // Today's expenses
      this.prisma.expense.aggregate({
        where: { date: { gte: today.start, lt: today.end } },
        _sum: { amount: true },
      }),

      // This month's completed sales
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, updatedAt: { gte: month.start, lt: month.end } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // This month's expenses
      this.prisma.expense.aggregate({
        where: { date: { gte: month.start, lt: month.end } },
        _sum: { amount: true },
      }),

      // Orders grouped by status
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Top 5 menu items by order count
      this.prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // Low stock materials
      this.prisma.material.findMany(),

      // Recent 10 orders
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          salesman: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          maker: { select: { id: true, name: true } },
        },
      }),

      // Sales by salesman (this month)
      this.prisma.order.groupBy({
        by: ['salesmanId'],
        where: { status: OrderStatus.COMPLETED, updatedAt: { gte: month.start } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Purchases this month
      this.prisma.purchase.aggregate({
        where: { purchaseDate: { gte: month.start, lt: month.end } },
        _sum: { totalCost: true },
        _count: true,
      }),

      // Daily revenue - last 30 days (raw query for date grouping)
      this.prisma.$queryRaw<{ date: string; revenue: number }[]>`
          SELECT
            DATE("updatedAt") as date,
            SUM("totalAmount")::float as revenue
          FROM orders
          WHERE status = 'COMPLETED'
            AND "updatedAt" >= ${last30.start}
            AND "updatedAt" < ${last30.end}
          GROUP BY DATE("updatedAt")
          ORDER BY date ASC
        `,
    ]);

    // Enrich top menu items with names
    const menuItemIds = topMenuItems.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true },
    });
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m.name]));

    // Enrich sales by salesman with names
    const salesmanIds = salesBySalesman.map((s) => s.salesmanId);
    const salesmen = await this.prisma.user.findMany({
      where: { id: { in: salesmanIds } },
      select: { id: true, name: true },
    });
    const salesmanMap = new Map(salesmen.map((s) => [s.id, s.name]));

    const salesTodayAmt = Number(salesToday._sum.totalAmount ?? 0);
    const expensesTodayAmt = Number(expensesToday._sum.amount ?? 0);
    const salesMonthAmt = Number(salesThisMonth._sum.totalAmount ?? 0);
    const expensesMonthAmt = Number(expensesThisMonth._sum.amount ?? 0);

    return {
      today: {
        sales: salesTodayAmt,
        expenses: expensesTodayAmt,
        netProfit: salesTodayAmt - expensesTodayAmt,
      },
      thisMonth: {
        sales: salesMonthAmt,
        expenses: expensesMonthAmt,
        netProfit: salesMonthAmt - expensesMonthAmt,
        orderCount: salesThisMonth._count,
        purchaseCost: Number(purchasesThisMonth._sum.totalCost ?? 0),
        purchaseCount: purchasesThisMonth._count,
      },
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),
      topMenuItems: topMenuItems.map((i) => ({
        menuItemId: i.menuItemId,
        name: menuItemMap.get(i.menuItemId) ?? 'Unknown',
        totalQuantity: Number(i._sum.quantity ?? 0),
      })),
      lowStockMaterials: lowStockMaterials.filter(
        (m) => Number(m.currentStock) < Number(m.minStockLevel),
      ),
      recentOrders,
      salesBySalesman: salesBySalesman.map((s) => ({
        salesmanId: s.salesmanId,
        name: salesmanMap.get(s.salesmanId) ?? 'Unknown',
        totalSales: Number(s._sum.totalAmount ?? 0),
        orderCount: s._count,
      })),
      dailyRevenueLast30: dailyRevenueLast30,
    };
  }

  // ─── Salesman Dashboard ───────────────────────────────────────────────

  async getSalesmanDashboard(salesmanId: string) {
    const today = this.getTodayRange();
    const month = this.getMonthRange();

    const [todayOrders, monthStats, topClients, recentOrders] = await Promise.all([
      this.prisma.order.count({
        where: { salesmanId, createdAt: { gte: today.start, lt: today.end } },
      }),

      this.prisma.order.aggregate({
        where: {
          salesmanId,
          status: OrderStatus.COMPLETED,
          updatedAt: { gte: month.start, lt: month.end },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Top clients by order count
      this.prisma.order.groupBy({
        by: ['clientId'],
        where: { salesmanId, clientId: { not: null } },
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _count: { clientId: 'desc' } },
        take: 5,
      }),

      this.prisma.order.findMany({
        where: { salesmanId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);

    // Enrich client names
    const clientIds = topClients.map((c) => c.clientId).filter(Boolean) as string[];
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    return {
      todayOrderCount: todayOrders,
      thisMonth: {
        totalSales: Number(monthStats._sum.totalAmount ?? 0),
        completedOrders: monthStats._count,
      },
      topClients: topClients.map((c) => ({
        clientId: c.clientId,
        name: clientMap.get(c.clientId) ?? 'Walk-in',
        orderCount: c._count,
        totalSpent: Number(c._sum.totalAmount ?? 0),
      })),
      recentOrders,
    };
  }

  // ─── Maker Dashboard ─────────────────────────────────────────────────

  async getMakerDashboard(makerId: string) {
    const today = this.getTodayRange();
    const month = this.getMonthRange();

    const [assignedOrders, inProgressOrders, completedToday, completedThisMonth] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { makerId, status: OrderStatus.ASSIGNED },
          include: {
            client: { select: { id: true, name: true } },
            items: { include: { menuItem: { select: { id: true, name: true } } } },
          },
          orderBy: { updatedAt: 'asc' },
        }),

        this.prisma.order.findMany({
          where: { makerId, status: OrderStatus.IN_PROGRESS },
          include: {
            client: { select: { id: true, name: true } },
            items: { include: { menuItem: { select: { id: true, name: true } } } },
          },
        }),

        this.prisma.order.count({
          where: {
            makerId,
            status: OrderStatus.COMPLETED,
            updatedAt: { gte: today.start, lt: today.end },
          },
        }),

        this.prisma.order.count({
          where: {
            makerId,
            status: OrderStatus.COMPLETED,
            updatedAt: { gte: month.start, lt: month.end },
          },
        }),
      ]);

    return {
      assignedOrders,
      inProgressOrders,
      completedToday,
      completedThisMonth,
    };
  }

  // ─── Supplier Dashboard ───────────────────────────────────────────────

  async getSupplierDashboard(supplierId: string) {
    const month = this.getMonthRange();

    const [lowStockMaterials, recentPurchases, monthlySpend] = await Promise.all([
      this.prisma.material.findMany(),

      this.prisma.purchase.findMany({
        where: { supplierId },
        take: 10,
        orderBy: { purchaseDate: 'desc' },
        include: { material: { select: { id: true, name: true, unit: true } } },
      }),

      this.prisma.purchase.aggregate({
        where: {
          supplierId,
          purchaseDate: { gte: month.start, lt: month.end },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

    return {
      lowStockMaterials: lowStockMaterials.filter(
        (m) => Number(m.currentStock) < Number(m.minStockLevel),
      ),
      allMaterials: lowStockMaterials,
      recentPurchases,
      thisMonth: {
        totalSpent: Number(monthlySpend._sum.totalCost ?? 0),
        purchaseCount: monthlySpend._count,
      },
    };
  }
}
