import { catalog, downloadZip, getState, handshake, normalizeCameraIp, normalizeMediaFile } from '@/lib/gf10';

export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') return '相机响应超时，请确认 GF10 Wi-Fi 仍保持连接。';
  return error instanceof Error ? error.message : '相机请求失败';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'health';
  try {
    const ip = normalizeCameraIp(url.searchParams.get('ip'));
    if (action === 'connect') {
      const connection = await handshake(ip);
      const state = await getState(ip);
      return json({ ok: true, connection, state, waitingForConfirmation: state.result !== 'ok' });
    }
    if (action === 'state') return json({ ok: true, state: await getState(ip) });
    if (action === 'catalog') return json({ ok: true, ...(await catalog(ip)) });
    return json({ ok: true, service: 'GF10 Photo Desk' });
  } catch (error) {
    return json({ ok: false, error: errorMessage(error) }, 502);
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') !== 'download') return json({ ok: false, error: '不支持的操作' }, 405);
  try {
    const ip = normalizeCameraIp(url.searchParams.get('ip'));
    const body = await request.json() as { files?: unknown };
    const files = Array.isArray(body.files) ? body.files.map((file) => normalizeMediaFile(typeof file === 'string' ? file : '')).filter((file) => file.startsWith('DO')) : [];
    const zip = await downloadZip(ip, files);
    return new Response(zip as BodyInit, { status: 200, headers: { 'Content-Type': 'application/zip', 'Content-Length': String(zip.byteLength), 'Content-Disposition': 'attachment; filename="GF10-photos.zip"', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return json({ ok: false, error: errorMessage(error) }, 502);
  }
}
