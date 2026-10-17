FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g @nestjs/cli
COPY . .
RUN npx prisma generate || true
RUN npm run build
# Sincroniza el esquema de Prisma con la BD (no hay carpeta migrations) y arranca.
# --accept-data-loss: Prisma avisa por el UNIQUE nuevo de event_key (columna nueva, todo en NULL: no se pierde nada)
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start:prod"]
