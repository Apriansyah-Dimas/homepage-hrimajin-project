import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';

const RESERVED_PATHS = new Set([
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
]);

export async function GET(_request: Request, { params }: { params: { directPath: string } }) {
  const slug = (params.directPath || '').toLowerCase();
  if (!slug || RESERVED_PATHS.has(slug)) {
    return NextResponse.next();
  }

  const { data, error } = await supabaseServer
    .from('cards')
    .select('link,direct_link_enabled')
    .eq('direct_path', slug)
    .limit(1)
    .single();

  if (error || !data || !data.direct_link_enabled) {
    return NextResponse.next();
  }

  return NextResponse.redirect(data.link, 302);
}
