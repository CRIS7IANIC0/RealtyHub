import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service'; // 1. Importamos el servicio

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PrismaService], // 2. Lo agregamos aquí
})
export class AppModule { }