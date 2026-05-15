// apps/api/src/materials/materials.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.material.findMany({ orderBy: { name: 'asc' } });
  }

  async findLowStock() {
    // Prisma doesn't support field comparisons in where directly,
    // so we fetch all and filter — or use raw SQL for large datasets
    const materials = await this.prisma.material.findMany();
    return materials.filter((m) => Number(m.currentStock) < Number(m.minStockLevel));
  }

  async findOne(id: string) {
    const m = await this.prisma.material.findUnique({ where: { id } });
    if (!m) throw new NotFoundException(`Material ${id} not found`);
    return m;
  }

  async create(dto: CreateMaterialDto) {
    const existing = await this.prisma.material.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Material name already exists');

    return this.prisma.material.create({ data: dto });
  }

  async update(id: string, data: Partial<CreateMaterialDto>) {
    await this.findOne(id);
    return this.prisma.material.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.material.delete({ where: { id } });
  }
}
