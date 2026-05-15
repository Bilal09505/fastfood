// apps/api/src/purchases/purchases.controller.ts
import {
  Controller, Get, Post, Param, Body, UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPPLIER)
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.purchasesService.findAll(user.id, user.role);
  }

  @Get('summary')
  @Roles(Role.ADMIN)
  getSummary() {
    return this.purchasesService.getSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto, @CurrentUser('id') userId: string) {
    return this.purchasesService.create(dto, userId);
  }
}
