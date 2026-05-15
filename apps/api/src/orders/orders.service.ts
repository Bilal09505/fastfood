// apps/api/src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Role } from '@prisma/client';

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  ASSIGNED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.READY],
  READY: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

// Status transitions a MAKER is allowed to make
const MAKER_TRANSITIONS = [
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
];

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: Role, status?: OrderStatus, date?: string) {
    const where: any = {};

    if (userRole === Role.SALESMAN) where.salesmanId = userId;
    if (userRole === Role.MAKER) where.makerId = userId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        salesman: { select: { id: true, name: true } },
        maker: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        items: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        salesman: { select: { id: true, name: true } },
        maker: { select: { id: true, name: true } },
        client: true,
        items: {
          include: {
            menuItem: {
              include: { materials: { include: { material: true } } },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found`);

    if (userRole === Role.SALESMAN && order.salesmanId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (userRole === Role.MAKER && order.makerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async create(dto: CreateOrderDto, salesmanId: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Fetch menu items to get current prices
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable or do not exist');
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]));

    const totalAmount = dto.items.reduce((sum, item) => {
      return sum + (Number(priceMap.get(item.menuItemId)) * item.quantity);
    }, 0);

    return this.prisma.order.create({
      data: {
        salesmanId,
        clientId: dto.clientId,
        notes: dto.notes,
        totalAmount,
        status: OrderStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId),
          })),
        },
      },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true } } } },
        client: { select: { id: true, name: true } },
      },
    });
  }

  async assignMaker(orderId: string, makerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only PENDING orders can be assigned');
    }

    const maker = await this.prisma.user.findUnique({ where: { id: makerId } });
    if (!maker || maker.role !== Role.MAKER || !maker.isActive) {
      throw new BadRequestException('Invalid maker');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { makerId, status: OrderStatus.ASSIGNED },
      include: { maker: { select: { id: true, name: true } } },
    });
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: Role,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // Maker can only update their own orders
    if (userRole === Role.MAKER) {
      if (order.makerId !== userId) throw new ForbiddenException('Not your order');
      if (!MAKER_TRANSITIONS.includes(newStatus as any)) {
        throw new BadRequestException(`Maker cannot set status to ${newStatus}`);
      }
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }

    // If completing, deduct stock in a transaction
    if (newStatus === OrderStatus.COMPLETED) {
      return this.completeOrder(order.id);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }

  async cancel(orderId: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (userRole === Role.SALESMAN) {
      if (order.salesmanId !== userId) throw new ForbiddenException('Not your order');
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Salesman can only cancel PENDING orders');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async getStats(userId: string, userRole: Role) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (userRole === Role.SALESMAN) {
      const [todayOrders, monthOrders] = await Promise.all([
        this.prisma.order.count({
          where: { salesmanId: userId, createdAt: { gte: today, lt: tomorrow } },
        }),
        this.prisma.order.aggregate({
          where: {
            salesmanId: userId,
            status: OrderStatus.COMPLETED,
            createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);
      return { todayOrders, monthSales: monthOrders._sum.totalAmount, monthCount: monthOrders._count };
    }

    if (userRole === Role.MAKER) {
      const [todayCount, monthCount] = await Promise.all([
        this.prisma.order.count({
          where: {
            makerId: userId,
            status: OrderStatus.COMPLETED,
            updatedAt: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.order.count({
          where: {
            makerId: userId,
            status: OrderStatus.COMPLETED,
            updatedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
        }),
      ]);
      return { completedToday: todayCount, completedThisMonth: monthCount };
    }

    return {};
  }

  // ─── Private: complete order + atomic stock deduction ───────────────

  private async completeOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: {
                include: { materials: true },
              },
            },
          },
        },
      });

      // Deduct materials
      for (const orderItem of order.items) {
        for (const recipe of orderItem.menuItem.materials) {
          const deductAmount = Number(recipe.quantityNeeded) * orderItem.quantity;

          await tx.material.update({
            where: { id: recipe.materialId },
            data: {
              currentStock: {
                decrement: deductAmount,
              },
            },
          });
        }
      }

      // Mark order as completed
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });
    });
  }
}
