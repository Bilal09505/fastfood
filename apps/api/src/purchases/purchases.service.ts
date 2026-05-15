// apps/api/src/purchases/purchases.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Role } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: Role) {
    const where = userRole === Role.ADMIN ? {} : { supplierId: userId };

    return this.prisma.purchase.findMany({
      where,
      include: {
        material: { select: { id: true, name: true, unit: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
    return purchase;
  }

  async create(dto: CreatePurchaseDto, supplierId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });

    if (!material) throw new NotFoundException('Material not found');

    const totalCost = dto.quantity * dto.costPerUnit;

    // Atomic: create purchase record + update material stock
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          materialId: dto.materialId,
          quantity: dto.quantity,
          costPerUnit: dto.costPerUnit,
          totalCost,
          notes: dto.notes,
        },
        include: {
          material: { select: { id: true, name: true, unit: true } },
        },
      });

      await tx.material.update({
        where: { id: dto.materialId },
        data: { currentStock: { increment: dto.quantity } },
      });

      return purchase;
    });
  }

  async getSummary() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [byMaterial, byMonth] = await Promise.all([
      this.prisma.purchase.groupBy({
        by: ['materialId'],
        _sum: { totalCost: true, quantity: true },
      }),
      this.prisma.purchase.aggregate({
        where: { purchaseDate: { gte: firstOfMonth } },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

    return { byMaterial, thisMonth: byMonth };
  }
}
