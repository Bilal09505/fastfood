// apps/api/src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, AssignMakerDto, UpdateStatusDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus, Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALESMAN, Role.MAKER)
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: OrderStatus,
    @Query('date') date?: string,
  ) {
    return this.ordersService.findAll(user.id, user.role, status, date);
  }

  @Get('stats/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALESMAN, Role.MAKER)
  getStats(@CurrentUser() user: any) {
    return this.ordersService.getStats(user.id, user.role);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALESMAN, Role.MAKER)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user.id, user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALESMAN)
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  assignMaker(@Param('id') id: string, @Body() dto: AssignMakerDto) {
    return this.ordersService.assignMaker(id, dto.makerId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MAKER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user.id, user.role);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALESMAN)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.cancel(id, user.id, user.role);
  }
}
