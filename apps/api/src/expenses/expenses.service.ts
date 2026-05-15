// apps/api/src/expenses/expenses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(month?: string, category?: ExpenseCategory) {
    const where: any = {};

    if (category) where.category = category;

    if (month) {
      // month format: YYYY-MM
      const [year, mon] = month.split('-').map(Number);
      where.date = {
        gte: new Date(year, mon - 1, 1),
        lt: new Date(year, mon, 1),
      };
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { recordedBy: { select: { id: true, name: true } } },
    });

    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async create(dto: CreateExpenseDto, recordedById: string) {
    return this.prisma.expense.create({
      data: {
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        recordedById,
      },
      include: { recordedBy: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: Partial<CreateExpenseDto>) {
    await this.findOne(id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [byCategory, total] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return { byCategory, total };
  }
}
