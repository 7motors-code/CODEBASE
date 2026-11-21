import 'server-only';
import { cookies } from 'next/headers';
import type { Lang } from './i18n';
import { t as tt } from './i18n';
export function getLang(): Lang { return cookies().get('lang')?.value === 'ur' ? 'ur' : 'en'; }
export function getTheme(): 'dark' | 'light' { return cookies().get('theme')?.value === 'light' ? 'light' : 'dark'; }
export function T() { const l = getLang(); return (key: string, en?: string) => tt(l, key, en); }
