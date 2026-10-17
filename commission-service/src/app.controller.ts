import { BadRequestException, Body, Controller, Delete, Get, Inject, Put, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller('commissions')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: AppService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) {}

  // 1. Eventos asíncronos (RabbitMQ · realtyhub_sales_queue)
  @EventPattern('contract.signed')
  async handleContractSigned(@Payload() data: any) {
    console.log(`💰 [COMMISSION] Contrato firmado detectado: ${data?.id}`);
    try {
      const c = await this.service.registerSignedContract(data);
      if (c) console.log(`✅ [COMMISSION] ${c.operation_type} · total $${c.amount} (agente $${c.agent_amount} / oficina $${c.office_amount} / central $${c.central_amount})`);
    } catch (error) {
      console.error('❌ [COMMISSION] Error al registrar la comisión:', error);
    }
  }

  @EventPattern('contract.reverted')
  async handleContractReverted(@Payload() data: any) {
    try {
      if (data?.id) await this.service.cancelForContract(data.id);
    } catch (error) {
      console.error('❌ [COMMISSION] Error al anular la comisión:', error);
    }
  }

  // 2. HTTP
  @Get()
  async getAllCommissions() {
    return this.prisma.commission.findMany({ orderBy: { created_at: 'desc' } });
  }

  @Get('agreements')
  async getAgreements() {
    return this.service.listAgreements();
  }

  @Post('agreements')
  async createAgreement(@Body() body: any) {
    return this.service.createAgreement(body, body?.created_by);
  }

  @Get('agent-rules')
  async getAgentRules() {
    return this.service.listAgentRules();
  }

  @Put('agent-rules')
  async setAgentRule(@Body() body: any) {
    return this.service.setAgentRule(body, body?.updated_by);
  }

  @Delete('agent-rules/:id')
  async deleteAgentRule(@Param('id') id: string) {
    return this.service.deleteAgentRule(id);
  }

  @Patch(':id/pay')
  async markAsPaid(@Param('id') id: string) {
    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException('Comisión no encontrada');
    if (commission.status === 'Anulada') throw new BadRequestException('Una comisión anulada no puede pagarse');
    if (commission.status === 'Pagada') return commission;
    const paid = await this.prisma.commission.update({ where: { id }, data: { status: 'Pagada', paid_at: new Date() } });
    try {
      await lastValueFrom(this.notificationsClient.emit('commission.paid', paid).pipe(timeout(3000)));
    } catch (error) {
      console.error('❌ No se pudo emitir "commission.paid":', error);
    }
    return paid;
  }
}
