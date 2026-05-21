// apps/api/src/menu/menu.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto, CreateMenuItemDto, SetRecipeDto, UpdateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private menuService: MenuService) { }

  // ─── Categories ───────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories() {
    return this.menuService.findAllCategories();
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ─── Menu Items ───────────────────────────────────────────────────────

  @Get('menu-items')
  findAllItems() {
    return this.menuService.findAllItems();
  }

  @Get('menu-items/:id')
  findOneItem(@Param('id') id: string) {
    return this.menuService.findOneItem(id);
  }

  @Post('menu-items')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Patch('menu-items/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateItem(@Param('id') id: string, @Body() body: Partial<CreateMenuItemDto>) {
    return this.menuService.updateItem(id, body);
  }

  @Delete('menu-items/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }

  // ─── Recipe ───────────────────────────────────────────────────────────

  @Get('menu-items/:id/materials')
  getRecipe(@Param('id') id: string) {
    return this.menuService.getRecipe(id);
  }

  @Post('menu-items/:id/materials')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setRecipe(@Param('id') id: string, @Body() dto: SetRecipeDto) {
    return this.menuService.setRecipe(id, dto);
  }
}
