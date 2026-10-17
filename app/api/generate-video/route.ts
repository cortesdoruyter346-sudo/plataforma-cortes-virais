import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, style } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const stylePrompts: Record<string, string> = {
      realista: 'photorealistic, cinematic, 8k, high detail, natural lighting',
      anime: 'anime style, vibrant colors, studio ghibli inspired, detailed animation',
      amazonia: 'amazon rainforest setting, lush greenery, natural environment, tribal, cinematic',
      urbano: 'urban city setting, street style, neon lights, modern, gritty, cinematic',
    };

    const fullPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.realista}`;

    const result = await fal.subscribe('fal-ai/veo3', {
      input: {
        prompt: fullPrompt,
        duration: '6s',
      },
    });

    const data = result.data as Record<string, unknown> | null;
    return NextResponse.json({
      videoUrl: (data?.video_url as string) || (data?.url as string) || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar vídeo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
