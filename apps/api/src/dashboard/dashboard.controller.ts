// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('salesman')
  @Roles(Role.ADMIN, Role.SALESMAN)
  getSalesmanDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getSalesmanDashboard(userId);
  }

  @Get('maker')
  @Roles(Role.ADMIN, Role.MAKER)
  getMakerDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getMakerDashboard(userId);
  }

  @Get('supplier')
  @Roles(Role.ADMIN, Role.SUPPLIER)
  getSupplierDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getSupplierDashboard(userId);
  }
}
