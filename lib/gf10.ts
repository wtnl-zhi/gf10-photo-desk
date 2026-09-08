export type GF10State = {
  result: string;
  batt?: string;
  cammode?: string;
  sdcardstatus?: string;
  version?: string;
};

export type GF10Photo = {
  id: string;
  title: string;
  originalFile: string;
  previewFile: string;
  thumbnailFile: string;
  size: number;
  date: string;
};

type Session = { cameraName?: string; lastActivity: number };

const sessions = new Map<string, Session>();
const REQUEST_TIMEOUT = 14_000;
const PAGE_SIZE = 25;

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function privateIpv4(value: string) {
  const parts = value.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 169 && parts[1] === 254;
}

export function normalizeCameraIp(value: string | null | undefined) {
  const ip = (value || '192.168.54.1').trim();
  if (!privateIpv4(ip)) throw new Error('相机地址必须是局域网 IPv4 地址，例如 192.168.54.1');
  return ip;
}

export function normalizeMediaFile(value: string | null | undefined) {
  const file = (value || '').trim();
  if (!/^(DO|DS|DT)[A-Za-z0-9_.-]+$/i.test(file)) throw new Error('媒体文件名无效');
  return file;
}

function cameraBase(ip: string, port = 80) {
  return `http://${ip}:${port}`;
}

async function cameraRequest(ip: string, path: string, init?: RequestInit, port = 80) {
  const requestTimer = timeoutSignal(REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${cameraBase(ip, port)}${path}`, { ...init, signal: requestTimer.signal, cache: 'no-store' });
    return response;
  } finally {
    requestTimer.clear();
  }
}

export async function cameraText(ip: string, path: string, init?: RequestInit) {
  const response = await cameraRequest(ip, path, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`相机返回 HTTP ${response.status}`);
  return text.trim();
}

export async function cameraMedia(ip: string, file: string, range?: string) {
  const safeFile = normalizeMediaFile(file);
  const headers = new Headers();
  if (range) headers.set('Range', range);
  return cameraRequest(ip, `/${safeFile}`, { headers }, 50001);
}

function xmlDecode(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    if (entity.toLowerCase() === 'amp') return '&';
    if (entity.toLowerCase() === 'lt') return '<';
    if (entity.toLowerCase() === 'gt') return '>';
    if (entity.toLowerCase() === 'quot') return '"';
    if (entity.toLowerCase() === 'apos') return "'";
    const code = entity.toLowerCase().startsWith('#x') ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return Number.isNaN(code) ? _ : String.fromCodePoint(code);
  });
}

function tagText(xml: string, name: string) {
  const match = xml.match(new RegExp(`<(?:(?:[a-zA-Z0-9_-]+):)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[a-zA-Z0-9_-]+):)?${name}>`, 'i'));
  return match ? xmlDecode(match[1].trim()) : '';
}

function attribute(openTag: string, name: string) {
  const match = openTag.match(new RegExp(`(?:^|\\s)${name.replace(':', '\\:')}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? xmlDecode(match[1]) : '';
}

function resultXml(soap: string) {
  const result = tagText(soap, 'Result');
  return result.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function fileFromUrl(url: string) {
  try {
    return new URL(url).pathname.split('/').pop() || '';
  } catch {
    return url.split('/').pop()?.split('?')[0] || '';
  }
}

function parsePhotos(didl: string, offset: number) {
  const photos: GF10Photo[] = [];
  const itemPattern = /<(item|container)\b[^>]*>[\s\S]*?<\/(?:item|container)>/gi;
  for (const match of didl.matchAll(itemPattern)) {
    const block = match[0];
    const openTag = block.match(/^<(?:item|container)\b[^>]*>/i)?.[0] || '';
    const resources = [...block.matchAll(/<res\b([^>]*)>[\s\S]*?<\/res>/gi)].map((res) => {
      const full = res[0];
      const url = xmlDecode(full.replace(/^<res\b[^>]*>/i, '').replace(/<\/res>$/i, '').trim());
      const attrs = res[1];
      const pn = attribute(attrs, 'pv:pn') || attribute(attrs, 'pn') || (attrs.includes('CAM_ORG') ? 'CAM_ORG' : attrs.includes('CAM_LRGTN') ? 'CAM_LRGTN' : attrs.includes('CAM_TN') ? 'CAM_TN' : '');
      return { url, pn, size: Number(attribute(attrs, 'size')) || 0 };
    });
    const byMarker = (marker: string, prefix: string) => resources.find((resource) => resource.pn === marker || fileFromUrl(resource.url).startsWith(prefix));
    const original = byMarker('CAM_ORG', 'DO');
    const preview = byMarker('CAM_LRGTN', 'DS');
    const thumbnail = byMarker('CAM_TN', 'DT');
    if (!original || !preview || !thumbnail) continue;
    const originalFile = fileFromUrl(original.url);
    const id = attribute(openTag, 'id') || originalFile || `photo-${offset + photos.length}`;
    photos.push({
      id,
      title: tagText(block, 'title') || originalFile.replace(/^DO/, '').replace(/\.JPG$/i, ''),
      originalFile,
      previewFile: fileFromUrl(preview.url),
      thumbnailFile: fileFromUrl(thumbnail.url),
      size: original.size,
      date: tagText(block, 'date') || tagText(block, 'dc:date'),
    });
  }
  return photos;
}

function parseState(xml: string): GF10State {
  return { result: tagText(xml, 'result') || 'unknown', batt: tagText(xml, 'batt'), cammode: tagText(xml, 'cammode'), sdcardstatus: tagText(xml, 'sdcardstatus'), version: tagText(xml, 'version') };
}

export async function getState(ip: string) {
  const xml = await cameraText(ip, '/cam.cgi?mode=getstate');
  const state = parseState(xml);
  if (state.result === 'ok') {
    const session = sessions.get(ip);
    if (session) session.lastActivity = Date.now();
  }
  return state;
}

export async function handshake(ip: string) {
  const raw = await cameraText(ip, '/cam.cgi?mode=accctrl&type=req_acc&value=0&value2=Vexia%20Fcs');
  const fields = raw.split(',');
  const accepted = fields[0] === 'ok';
  if (accepted) sessions.set(ip, { cameraName: fields[1], lastActivity: Date.now() });
  return { accepted, raw, cameraName: fields[1] || '' };
}

export async function ensureSession(ip: string) {
  const session = sessions.get(ip);
  if (!session || Date.now() - session.lastActivity > 11_000) await handshake(ip);
}

async function enterPlayback(ip: string) {
  await cameraText(ip, '/cam.cgi?mode=camcmd&value=playmode');
  await new Promise((resolve) => setTimeout(resolve, 320));
  return getState(ip);
}

function soapEnvelope(start: number) {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1"><ObjectID>0</ObjectID><BrowseFlag>BrowseDirectChildren</BrowseFlag><Filter>*</Filter><StartingIndex>${start}</StartingIndex><RequestedCount>${PAGE_SIZE}</RequestedCount><SortCriteria></SortCriteria></u:Browse></s:Body></s:Envelope>`;
}

async function browse(ip: string, start: number) {
  const response = await cameraRequest(ip, '/Server0/CDS_control', { method: 'POST', headers: { 'Content-Type': 'text/xml; charset="utf-8"', SOAPAction: '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"' }, body: soapEnvelope(start) }, 60606);
  const text = await response.text();
  if (!response.ok) throw new Error(`相机目录返回 HTTP ${response.status}`);
  const didl = resultXml(text);
  const numberReturned = Number(tagText(text, 'NumberReturned')) || 0;
  const totalMatches = Number(tagText(text, 'TotalMatches')) || start + numberReturned;
  return { photos: parsePhotos(didl, start), numberReturned, totalMatches };
}

export async function catalog(ip: string) {
  await ensureSession(ip);
  let state = await getState(ip);
  if (state.result !== 'ok') {
    await handshake(ip);
    state = await getState(ip);
  }
  if (state.result !== 'ok') throw new Error('相机尚未确认连接，请在相机屏幕上点击确认后重试。');
  if (state.cammode !== 'play') state = await enterPlayback(ip);
  if (state.result !== 'ok') throw new Error('相机未进入回放模式，请保持相机屏幕亮起后重试。');
  const info = await cameraText(ip, '/cam.cgi?mode=get_content_info');
  const total = Number(tagText(info, 'total_content_number')) || 0;
  const photos: GF10Photo[] = [];
  for (let start = 0; start < Math.max(total, 1); start += PAGE_SIZE) {
    const page = await browse(ip, start);
    photos.push(...page.photos);
    if (!page.numberReturned || photos.length >= page.totalMatches) break;
  }
  return { photos, total: total || photos.length, state, cameraName: sessions.get(ip)?.cameraName || '' };
}
