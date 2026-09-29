import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { inferCity, inferOperation, inferType, normalizeStatus } from './property.utils';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
        await this.backfillLegacyProperties();
    }

    /**
     * Completa operación, tipo y ciudad en propiedades creadas antes de que
     * existieran esas columnas, y normaliza estados ("disponible" → "Disponible").
     * Es idempotente: sólo toca filas sin operación o con estado no canónico.
     */
    private async backfillLegacyProperties() {
        try {
            const rows = await this.property.findMany();
            let updated = 0;

            for (const p of rows) {
                const text = `${p.title} ${p.description}`;
                const status = normalizeStatus(p.status) ?? p.status;
                const needsFill = p.operation === null;
                if (!needsFill && status === p.status) continue;

                await this.property.update({
                    where: { id: p.id },
                    data: {
                        status,
                        ...(needsFill && {
                            operation: inferOperation(text),
                            property_type: p.property_type ?? inferType(text),
                            city: p.city ?? inferCity(p.address),
                        }),
                    },
                });
                updated++;
            }

            if (updated > 0) {
                console.log(`🏠 Backfill: ${updated} propiedad(es) completadas con operación/tipo/ciudad`);
            }
        } catch (error) {
            // No impedir el arranque del servicio por un fallo del backfill
            console.error('❌ Error en el backfill de propiedades:', error);
        }
    }
}
