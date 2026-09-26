FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g @nestjs/cli
COPY . .
RUN npx prisma generate || true
RUN npm run build
# Sincroniza el esquema de Prisma con la BD (no hay carpeta migrations) y arranca
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start:prod"]
