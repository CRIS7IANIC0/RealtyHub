import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('leads')
export class AppController {
  constructor(private readonly prisma: PrismaService) { }

  @Get()
  async getAllLeads() {
    return this.prisma.lead.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  @Post()
  async createLead(
    @Body() data: {
      name: string;
      email: string;
      phone: string;
      property_id: string;
      source: string;
      status?: string;
    },
  ) {
    console.log('📥 Registrando nuevo lead:', data.name);

    return this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        property_id: data.property_id,
        source: data.source,
        status: data.status || 'Nuevo',
      },
    });
  }
}