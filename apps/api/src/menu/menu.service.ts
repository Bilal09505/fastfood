// apps/api/src/menu/menu.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-category.dto';
import { SetRecipeDto } from './dto/create-category.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ─── Categories ──────────────────────────────────────────────────────

  findAllCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { menuItems: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Category already exists');

    return this.prisma.category.create({ data: { name: dto.name } });
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);
    return this.prisma.category.delete({ where: { id } });
  }

  private async findCategoryById(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  // ─── Menu Items ───────────────────────────────────────────────────────

  findAllItems() {
    return this.prisma.menuItem.findMany({
      include: {
        category: true,
        materials: {
          include: { material: { select: { id: true, name: true, unit: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        materials: {
          include: { material: true },
        },
      },
    });

    if (!item) throw new NotFoundException(`Menu item ${id} not found`);
    return item;
  }

  async createItem(dto: CreateMenuItemDto) {
    await this.findCategoryById(dto.categoryId);

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        price: dto.price,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable ?? true,
        imageUrl: dto.imageUrl,
      },
      include: { category: true },
    });
  }

  async updateItem(id: string, data: Partial<CreateMenuItemDto>) {
    await this.findOneItem(id);

    return this.prisma.menuItem.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteItem(id: string) {
    await this.findOneItem(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
  }

  // ─── Recipe (MenuItemMaterials) ───────────────────────────────────────

  async getRecipe(menuItemId: string) {
    await this.findOneItem(menuItemId);

    return this.prisma.menuItemMaterial.findMany({
      where: { menuItemId },
      include: { material: true },
    });
  }

  async setRecipe(menuItemId: string, dto: SetRecipeDto) {
    await this.findOneItem(menuItemId);

    // Replace all existing recipe entries
    return this.prisma.$transaction(async (tx) => {
      await tx.menuItemMaterial.deleteMany({ where: { menuItemId } });

      const entries = dto.materials.map((m) => ({
        menuItemId,
        materialId: m.materialId,
        quantityNeeded: m.quantityNeeded,
      }));

      await tx.menuItemMaterial.createMany({ data: entries });

      return tx.menuItemMaterial.findMany({
        where: { menuItemId },
        include: { material: true },
      });
    });
  }
}
