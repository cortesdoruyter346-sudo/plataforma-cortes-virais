import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { baseVideoUrl, faceImageUrl } = await req.json();

    if (!baseVideoUrl || !faceImageUrl) {
      return NextResponse.json(
        { error: 'Video base e foto do rosto são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await fal.subscribe('fal-ai/sync-labs', {
      input: {
        video_url: baseVideoUrl,
        face_image_url: faceImageUrl,
      },
    });

    const data = result.data as Record<string, unknown> | null;
    return NextResponse.json({
      videoUrl: (data?.video_url as string) || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao trocar rosto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
