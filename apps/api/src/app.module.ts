// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { MenuModule } from './menu/menu.module';
import { MaterialsModule } from './materials/materials.module';
import { OrdersModule } from './orders/orders.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DealsModule } from './deals/deals.module';

@Module({
  imports: [
    // Config - available globally across all modules
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database - global so all modules get PrismaService
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ClientsModule,
    MenuModule,
    MaterialsModule,
    OrdersModule,
    PurchasesModule,
    ExpensesModule,
    DashboardModule,
    DealsModule
  ],
  providers: [
    // Apply exception filter globally
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Apply logging interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
