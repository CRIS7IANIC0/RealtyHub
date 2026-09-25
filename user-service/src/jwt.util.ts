import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Obtiene la clave secreta JWT desde las variables de entorno.
 * Rechaza terminantemente cualquier valor por defecto o fallback inseguro.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new HttpException(
      'Configuración de seguridad incompleta: JWT_SECRET no está configurado en las variables de entorno (Railway).',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return secret;
}

/**
 * Codifica un objeto o string en formato Base64Url sin padding.
 */
function base64UrlEncode(data: string | object): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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
 * Genera un token JWT (HS256) estándar firmado con process.env.JWT_SECRET.
 * Sin dependencias externas para máxima compatibilidad y seguridad.
 */
export function signJwt(
  payload: Record<string, any>,
  expiresInSeconds: number = 60 * 60 * 24 * 7, // 7 días por defecto
): string {
  const secret = getJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
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
    throw new HttpException('Firma de token inválida o JWT_SECRET no coincide', HttpStatus.UNAUTHORIZED);
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
