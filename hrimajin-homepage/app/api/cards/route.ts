import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';

type CardRow = {
  id: string;
  title: string;
  link: string;
  image_url: string | null;
  created_at?: string;
};

const BUCKET = 'cards';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('cards')
      .select('id,title,link,image_url')
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
    }));

    return NextResponse.json({ cards }, { status: 200 });
  } catch (error) {
    console.error('GET /api/cards unexpected error', error);
    return NextResponse.json({ cards: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, link, imageDataUrl } = await request.json();

    if (!title || !link || !imageDataUrl) {
      return NextResponse.json(
        { error: 'Title, link, dan imageDataUrl wajib diisi.' },
        { status: 400 },
      );
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
      })
      .select('id,title,link,image_url')
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
    const { id, title, link, imageDataUrl } = await request.json();

    if (!id || !title || !link) {
      return NextResponse.json(
        { error: 'Id, title, dan link wajib diisi.' },
        { status: 400 },
      );
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
    };

    if (imageUrl) {
      updatePayload.image_url = imageUrl;
    }

    const { data: updated, error } = await supabaseServer
      .from('cards')
      .update(updatePayload)
      .eq('id', id)
      .select('id,title,link,image_url')
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
