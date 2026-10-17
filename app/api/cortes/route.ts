import { NextRequest, NextResponse } from 'next/server';

interface Corte {
  id: number;
  title: string;
  start: string;
  end: string;
  viralScore: number;
  reason: string;
}

const VIRAL_CUT_TEMPLATES: Corte[] = [
  { id: 1, title: 'HOOK VIRAL - Início Explosivo', start: '00:00', end: '00:30', viralScore: 98, reason: 'Hook forte que prende nos primeiros 3 segundos' },
  { id: 2, title: 'Momento de Tensão', start: '01:15', end: '01:45', viralScore: 95, reason: 'Pico de tensão emocional com alta retenção' },
  { id: 3, title: 'Revelação Impactante', start: '02:30', end: '03:00', viralScore: 93, reason: 'Informação surpresa que gera compartilhamento' },
  { id: 4, title: 'Pico de Emoção', start: '04:00', end: '04:30', viralScore: 91, reason: 'Momento emocional com grande potencial de engajamento' },
  { id: 5, title: 'Conflito Explosivo', start: '05:20', end: '05:50', viralScore: 89, reason: 'Disputa ou debate que prende até o final' },
  { id: 6, title: 'Twist - Virada Inesperada', start: '07:00', end: '07:30', viralScore: 87, reason: 'Virada de roteiro que surpreende o espectador' },
  { id: 7, title: 'Quote Bomável', start: '08:45', end: '09:15', viralScore: 85, reason: 'Frase de impacto perfeita para recompartilhamento' },
  { id: 8, title: 'Clímax do Vídeo', start: '10:30', end: '11:00', viralScore: 84, reason: 'Pico narrativo com maior densidade de conteúdo' },
  { id: 9, title: 'Final Surpresa', start: '12:15', end: '12:45', viralScore: 82, reason: 'Encerramento inesperado que gera comentários' },
  { id: 10, title: 'Bônus - Bastidores', start: '13:30', end: '14:00', viralScore: 78, reason: 'Conteúdo extra que humaniza e engaja' },
];

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

async function tryCobaltDownload(url: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        isAudioOnly: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'redirect' || data.status === 'stream') {
      return data.url as string;
    }
    if (data.status === 'picker' && Array.isArray(data.picker) && data.picker.length > 0) {
      return (data.picker[0] as { url: string }).url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return NextResponse.json(
        { error: 'Plataforma não suportada. Use YouTube, TikTok ou Instagram.' },
        { status: 400 }
      );
    }

    // Attempt real download via cobalt
    const downloadUrl = await tryCobaltDownload(url);

    const cortes = VIRAL_CUT_TEMPLATES.map((c) => ({
      ...c,
      downloadUrl: downloadUrl || undefined,
      source: url,
      platform,
    }));

    return NextResponse.json({
      success: true,
      source: url,
      platform,
      downloadUrl: downloadUrl || null,
      cortes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar cortes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
