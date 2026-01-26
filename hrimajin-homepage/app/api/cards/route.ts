import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';

type CardRow = {
  id: string;
  title: string;
  link: string;
  image_url: string | null;
  direct_link_enabled?: boolean;
  direct_path?: string | null;
  hidden?: boolean;
  created_at?: string;
};

const BUCKET = 'cards';
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

const validateDirectPath = (path: string, enabled: boolean) => {
  if (!enabled) return { error: '' };
  if (!path) return { error: 'Path wajib diisi.' };
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(path)) {
    return { error: 'Gunakan huruf/angka, - atau _, 2-60 karakter.' };
  }
  if (RESERVED_PATHS.includes(path.toLowerCase())) {
    return { error: 'Path ini ter-reserve sistem.' };
  }
  return { error: '' };
};

async function assertDirectPathAvailable(path: string, excludeId?: string) {
  const { data, error } = await supabaseServer
    .from('cards')
    .select('id')
    .ilike('direct_path', path)
    .limit(1);

  if (error) {
    console.error('Supabase direct_path check error', error);
    return { available: false, reason: 'error' as const };
  }

  if (!data || data.length === 0) {
    return { available: true };
  }

  const existing = data[0];
  if (excludeId && existing.id === excludeId) {
    return { available: true };
  }

  return { available: false, reason: 'taken' as const };
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('cards')
      .select('id,title,link,image_url,direct_link_enabled,direct_path,hidden')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase GET error', error);
      return NextResponse.json({ cards: [] }, { status: 200 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ cards: [] }, { status: 200 });
    }

    const cards = data.map((row: CardRow) => ({
      id: row.id,
      title: row.title,
      link: row.link,
      imageSrc: row.image_url ?? '',
      directLinkEnabled: Boolean(row.direct_link_enabled),
      directPath: row.direct_path ?? null,
      hidden: Boolean(row.hidden),
    }));

    return NextResponse.json({ cards }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cards unexpected error', error);
    return NextResponse.json({ cards: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      title,
      link,
      imageDataUrl,
      directLinkEnabled = false,
      directPath,
      hidden = false,
    } = await request.json();

    if (!title || !link || !imageDataUrl) {
      return NextResponse.json(
        { error: 'Title, link, dan imageDataUrl wajib diisi.' },
        { status: 400 },
      );
    }

    const normalizedPath = sanitizeDirectPath(directPath);
    const directValidation = validateDirectPath(normalizedPath, directLinkEnabled);
    if (directValidation.error) {
      return NextResponse.json({ error: directValidation.error }, { status: 400 });
    }

    if (directLinkEnabled) {
      const availability = await assertDirectPathAvailable(normalizedPath);
      if (!availability.available) {
        return NextResponse.json({ error: 'Path sudah dipakai.' }, { status: 409 });
      }
    }

    const parsed = parseDataUrl(imageDataUrl as string);
    if (!parsed) {
      return NextResponse.json({ error: 'Format gambar tidak valid.' }, { status: 400 });
    }

    const fileName = `${crypto.randomUUID()}.${parsed.extension}`;
    const path = `cards/${fileName}`;

    const upload = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, parsed.buffer, { contentType: parsed.contentType });

    if (upload.error) {
      console.error('Supabase upload error', upload.error);
      return NextResponse.json({ error: 'Gagal mengunggah gambar.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseServer.storage
      .from(BUCKET)
      .getPublicUrl(path);

    const imageUrl = publicUrlData.publicUrl;

    const { data: inserted, error } = await supabaseServer
      .from('cards')
      .insert({
        title: String(title).trim(),
        link: String(link).trim(),
        image_url: imageUrl,
        direct_link_enabled: Boolean(directLinkEnabled),
        direct_path: directLinkEnabled ? normalizedPath : null,
        hidden: Boolean(hidden),
      })
      .select('id,title,link,image_url,direct_link_enabled,direct_path,hidden')
      .single();

    if (error || !inserted) {
      console.error('Supabase insert error', error);
      return NextResponse.json({ error: 'Gagal menyimpan card.' }, { status: 500 });
    }

    return NextResponse.json(
      {
        card: {
          id: inserted.id,
          title: inserted.title,
          link: inserted.link,
          imageSrc: inserted.image_url ?? '',
          directLinkEnabled: Boolean(inserted.direct_link_enabled),
          directPath: inserted.direct_path ?? null,
          hidden: Boolean(inserted.hidden),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/cards unexpected error', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const {
      id,
      title,
      link,
      imageDataUrl,
      directLinkEnabled = false,
      directPath,
      hidden = false,
    } = await request.json();

    if (!id || !title || !link) {
      return NextResponse.json(
        { error: 'Id, title, dan link wajib diisi.' },
        { status: 400 },
      );
    }

    const normalizedPath = sanitizeDirectPath(directPath);
    const directValidation = validateDirectPath(normalizedPath, directLinkEnabled);
    if (directValidation.error) {
      return NextResponse.json({ error: directValidation.error }, { status: 400 });
    }

    if (directLinkEnabled) {
      const availability = await assertDirectPathAvailable(normalizedPath, id);
      if (!availability.available) {
        return NextResponse.json({ error: 'Path sudah dipakai.' }, { status: 409 });
      }
    }

    let imageUrl: string | null = null;

    if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:')) {
      const parsed = parseDataUrl(imageDataUrl);
      if (!parsed) {
        return NextResponse.json({ error: 'Format gambar tidak valid.' }, { status: 400 });
      }

      const fileName = `${crypto.randomUUID()}.${parsed.extension}`;
      const path = `cards/${fileName}`;

      const upload = await supabaseServer.storage
        .from(BUCKET)
        .upload(path, parsed.buffer, { contentType: parsed.contentType });

      if (upload.error) {
        console.error('Supabase upload error', upload.error);
        return NextResponse.json({ error: 'Gagal mengunggah gambar.' }, { status: 500 });
      }

      const { data: publicUrlData } = supabaseServer.storage
        .from(BUCKET)
        .getPublicUrl(path);

      imageUrl = publicUrlData.publicUrl;
    }

    const updatePayload: Record<string, unknown> = {
      title: String(title).trim(),
      link: String(link).trim(),
      direct_link_enabled: Boolean(directLinkEnabled),
      direct_path: directLinkEnabled ? normalizedPath : null,
      hidden: Boolean(hidden),
    };

    if (imageUrl) {
      updatePayload.image_url = imageUrl;
    }

    const { data: updated, error } = await supabaseServer
      .from('cards')
      .update(updatePayload)
      .eq('id', id)
      .select('id,title,link,image_url,direct_link_enabled,direct_path,hidden')
      .single();

    if (error || !updated) {
      console.error('Supabase update error', error);
      return NextResponse.json({ error: 'Gagal mengubah card.' }, { status: 500 });
    }

    return NextResponse.json(
      {
        card: {
          id: updated.id,
          title: updated.title,
          link: updated.link,
          imageSrc: updated.image_url ?? '',
          directLinkEnabled: Boolean(updated.direct_link_enabled),
          directPath: updated.direct_path ?? null,
          hidden: Boolean(updated.hidden),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PUT /api/cards unexpected error', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Id wajib diisi.' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('cards').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete error', error);
      return NextResponse.json({ error: 'Gagal menghapus card.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/cards unexpected error', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

function parseDataUrl(dataUrl: string):
  | { buffer: Buffer; contentType: string; extension: string }
  | null {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1]!;
  const base64 = match[2]!;
  const buffer = Buffer.from(base64, 'base64');
  const extension = contentType.split('/')[1] || 'png';
  return { buffer, contentType, extension };
}
