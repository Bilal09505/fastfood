// apps/api/src/expenses/expenses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExpenseCategory, Role } from '@prisma/client';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Query('month') month?: string,
    @Query('category') category?: ExpenseCategory,
  ) {
    return this.expensesService.findAll(month, category);
  }

  @Get('summary')
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getSummary(startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: string) {
    return this.expensesService.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateExpenseDto>) {
    return this.expensesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
