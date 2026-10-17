import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { personVideoUrl, garmentImageUrl } = await req.json();

    if (!personVideoUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: 'Video da pessoa e foto da roupa são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await fal.subscribe('fal-ai/kling/virtual-try-on', {
      input: {
        person_image_url: personVideoUrl,
        garment_image_url: garmentImageUrl,
      },
    });

    const data = result.data as Record<string, unknown> | null;
    return NextResponse.json({
      videoUrl: (data?.video_url as string) || (data?.image_url as string) || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao trocar roupa';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
