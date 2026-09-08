import { catalog, getState, handshake, normalizeCameraIp } from '@/lib/gf10';

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
