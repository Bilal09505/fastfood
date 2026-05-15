// apps/api/src/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: Role) {
    // Admin sees all; salesman sees only own clients
    const where = userRole === Role.ADMIN ? {} : { salesmanId: userId };

    return this.prisma.client.findMany({
      where,
      include: { salesman: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { salesman: { select: { id: true, name: true } } },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    if (userRole !== Role.ADMIN && client.salesmanId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return client;
  }

  async create(dto: CreateClientDto, salesmanId: string) {
    return this.prisma.client.create({
      data: { ...dto, salesmanId },
      include: { salesman: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: Partial<CreateClientDto>, userId: string, userRole: Role) {
    await this.findOne(id, userId, userRole); // ownership check

    return this.prisma.client.update({
      where: { id },
      data,
      include: { salesman: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    await this.findOne(id, userId, userRole);

    return this.prisma.client.delete({ where: { id } });
  }
}
