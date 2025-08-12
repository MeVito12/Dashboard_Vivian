import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitaliza a primeira letra de uma string
 * @param str - String para capitalizar
 * @returns String com primeira letra maiúscula
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitaliza a primeira letra de cada palavra
 * @param str - String para capitalizar
 * @returns String com primeira letra de cada palavra maiúscula
 */
export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
}

/**
 * Verifica se uma string é um UUID
 * @param str - String para verificar
 * @returns true se for um UUID, false caso contrário
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}