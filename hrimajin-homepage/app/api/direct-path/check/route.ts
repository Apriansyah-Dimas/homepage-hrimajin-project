import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';

const RESERVED_PATHS = [
  'login',
  'logout',
  'dashboard',
  'api',
  'assets',
  'admin',
  'static',
  'favicon.ico',
  '_next',
  'vercel',
  'robots.txt',
  'sitemap.xml',
];

const sanitizeDirectPath = (value?: string | null) =>
  (value ?? '').trim().replace(/^\/+/, '');

const validateDirectPath = (path: string) => {
  if (!path) return { error: 'Path wajib diisi.' };
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(path)) {
    return { error: 'Gunakan huruf/angka, - atau _, 2-60 karakter.' };
  }
  if (RESERVED_PATHS.includes(path.toLowerCase())) {
    return { error: 'Path ini ter-reserve sistem.' };
  }
  return { error: '' };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');
  const excludeId = searchParams.get('id') ?? undefined;

  const slug = sanitizeDirectPath(rawPath);
  const validation = validateDirectPath(slug);
  if (validation.error) {
    return NextResponse.json(
      { available: false, reason: validation.error.includes('reserve') ? 'reserved' : 'invalid', error: validation.error },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from('cards')
    .select('id')
    .ilike('direct_path', slug)
    .limit(1);

  if (error) {
    console.error('Supabase direct-path check error', error);
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ available: true }, { status: 200 });
  }

  const existing = data[0];
  if (excludeId && existing.id === excludeId) {
    return NextResponse.json({ available: true }, { status: 200 });
  }

  return NextResponse.json({ available: false, reason: 'taken' }, { status: 200 });
}
