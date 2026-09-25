import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Obtiene la clave secreta JWT desde las variables de entorno en api-gateway.
 * Rechaza terminantemente cualquier valor por defecto o fallback inseguro.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new HttpException(
      'Configuración de seguridad incompleta: JWT_SECRET no está configurado en las variables de entorno del API Gateway (Railway).',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return secret;
}

/**
 * Decodifica una cadena Base64Url a string utf-8.
 */
function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Valida y decodifica un token JWT (HS256) contra process.env.JWT_SECRET.
 */
export function verifyJwt(token: string): Record<string, any> {
  const secret = getJwtSecret();
  if (!token) {
    throw new HttpException('Token no proporcionado', HttpStatus.UNAUTHORIZED);
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new HttpException('Formato de token JWT inválido', HttpStatus.UNAUTHORIZED);
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToVerify = `${headerB64}.${payloadB64}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToVerify)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signatureB64 !== expectedSignature) {
    throw new HttpException('Firma de token inválida o no autorizada', HttpStatus.UNAUTHORIZED);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new HttpException('Payload de token corrupto', HttpStatus.UNAUTHORIZED);
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new HttpException('El token ha expirado', HttpStatus.UNAUTHORIZED);
  }

  return payload;
}
