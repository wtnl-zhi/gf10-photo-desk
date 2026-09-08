import { cameraMedia, ensureSession, normalizeCameraIp, normalizeMediaFile } from '@/lib/gf10';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const ip = normalizeCameraIp(url.searchParams.get('ip'));
    const file = normalizeMediaFile(url.searchParams.get('file'));
    await ensureSession(ip);
    const upstream = await cameraMedia(ip, file, request.headers.get('range') || undefined);
    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? '相机媒体响应超时' : error instanceof Error ? error.message : '媒体请求失败';
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
