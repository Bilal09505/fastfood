// deals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDealDto, UpdateDealDto } from './dto/create-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.deal.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: {
            menuItem: { include: { category: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: { include: { category: true } },
          },
        },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async create(dto: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        name:        dto.name,
        description: dto.description,
        price:       dto.price,
        items: {
          create: dto.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity:   item.quantity,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async update(id: string, dto: UpdateDealDto) {
    await this.findOne(id); // throws if not found

    return this.prisma.$transaction(async (tx) => {
      // if items are being updated, replace them entirely
      if (dto.items) {
        await tx.dealItem.deleteMany({ where: { dealId: id } });
      }

      return tx.deal.update({
        where: { id },
        data: {
          ...(dto.name        && { name:        dto.name }),
          ...(dto.description && { description: dto.description }),
          ...(dto.price       && { price:        dto.price }),
          ...(dto.items && {
            items: {
              create: dto.items.map(item => ({
                menuItemId: item.menuItemId,
                quantity:   item.quantity,
              })),
            },
          }),
        },
        include: { items: { include: { menuItem: true } } },
      });
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.deal.update({
      where: { id },
      data: { isActive: false },
    });
  }
}