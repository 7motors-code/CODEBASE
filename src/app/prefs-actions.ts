'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
const year = 60 * 60 * 24 * 365;
export async function toggleLang() {
  const c = cookies();
  c.set('lang', c.get('lang')?.value === 'ur' ? 'en' : 'ur', { maxAge: year, path: '/' });
  revalidatePath('/', 'layout');
}
export async function toggleTheme() {
  const c = cookies();
  c.set('theme', c.get('theme')?.value === 'light' ? 'dark' : 'light', { maxAge: year, path: '/' });
  revalidatePath('/', 'layout');
}
