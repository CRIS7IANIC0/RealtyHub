import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service'; // 1. Importación correcta

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PrismaService], // 2. Registro obligatorio aquí
})
export class AppModule { }