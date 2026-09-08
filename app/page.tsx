'use client';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  HardDriveDownload,
  Image as ImageIcon,
  LoaderCircle,
  Menu,
  RefreshCw,
  Settings2,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { compatibilityGroups, verifiedModels } from '@/lib/compatibility';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Photo = {
  id: string;
  title: string;
  originalFile: string;
  previewFile: string;
  thumbnailFile: string;
  size: number;
  date: string;
};

type CameraState = {
  result: string;
  cameraName?: string;
  batt?: string;
  cammode?: string;
  sdcardstatus?: string;
  version?: string;
};

type ConnectionState = 'idle' | 'connecting' | 'waiting' | 'connected' | 'error';
type ApiResponse = { ok?: boolean; error?: string; photos?: Photo[]; state?: CameraState; connection?: { accepted: boolean; raw: string; cameraName: string }; total?: number; cameraName?: string };

const DEFAULT_IP = '192.168.54.1';

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function formatDate(value: string) {
  if (!value || value.startsWith('0000')) return '相机未提供日期';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ');
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function cameraAsset(ip: string, file: string) {
  return `/api/media?ip=${encodeURIComponent(ip)}&file=${encodeURIComponent(file)}`;
}

function modelLabel(value: string) {
  const model = value.split(/[-_]/)[0];
  return model === 'GF10' ? 'DC-GF10' : model || '';
}

export default function Home() {
  const [ip, setIp] = useState(() => typeof window === 'undefined' ? DEFAULT_IP : window.localStorage.getItem('gf10-camera-ip') || DEFAULT_IP);
  const [draftIp, setDraftIp] = useState(() => typeof window === 'undefined' ? DEFAULT_IP : window.localStorage.getItem('gf10-camera-ip') || DEFAULT_IP);
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('先连接 GF10 的 Wi-Fi，再开始。');
  const [error, setError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const [detectedModel, setDetectedModel] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedCount = selected.size;
  const allSelected = photos.length > 0 && selectedCount === photos.length;
  const connected = connection === 'connected';
  const previewPhoto = previewIndex === null ? null : photos[previewIndex] ?? null;

  const api = useCallback(async (path: string, init?: RequestInit): Promise<ApiResponse> => {
    const response = await fetch(path, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as ApiResponse).error || '请求失败');
    return data as ApiResponse;
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setError('');
    setNotice('正在读取相机目录…');
    try {
      const data = await api(`/api/bridge?action=catalog&ip=${encodeURIComponent(ip)}`);
      setPhotos(data.photos ?? []);
      setSelected(new Set());
      setCameraState(data.state ?? null);
      if (data.cameraName) setDetectedModel(modelLabel(data.cameraName));
      setConnection('connected');
      setNotice(`已准备好 ${data.photos?.length ?? 0} 张照片`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取照片目录失败');
      setNotice('目录读取失败，请保持相机在 Wi-Fi 连接页面。');
    } finally {
      setCatalogLoading(false);
    }
  }, [api, ip]);

  const pollState = useCallback(async () => {
    try {
      const data = await api(`/api/bridge?action=state&ip=${encodeURIComponent(ip)}`);
      setCameraState(data.state ?? null);
      if (data.state?.result === 'ok') {
        setConnection('connected');
        setNotice('相机已确认，正在准备照片目录…');
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        void loadCatalog();
      }
    } catch {
      // The camera can take a few seconds to accept a pairing request.
    }
  }, [api, ip, loadCatalog]);

  const connect = useCallback(async () => {
    const nextIp = draftIp.trim() || DEFAULT_IP;
    setIp(nextIp);
    setConnection('connecting');
    setPhotos([]);
    setSelected(new Set());
    setCameraState(null);
    setError('');
    setNotice('正在请求相机连接…');
    try {
      const data = await api(`/api/bridge?action=connect&ip=${encodeURIComponent(nextIp)}`);
      setCameraState(data.state ?? null);
      if (data.connection?.cameraName) setDetectedModel(modelLabel(data.connection.cameraName));
      if (data.state?.result === 'ok') {
        setConnection('connected');
        setNotice('相机已连接，正在读取照片目录…');
        await loadCatalog();
        return;
      }
      setConnection('waiting');
      setNotice('请在相机屏幕上确认“连接应用程序”，页面会自动继续。');
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => void pollState(), 1800);
    } catch (err) {
      setConnection('error');
      setError(err instanceof Error ? err.message : '无法连接相机');
      setNotice('请确认电脑仍连接 GF10 的 Wi-Fi。');
    }
  }, [api, draftIp, loadCatalog, pollState]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => void pollState(), 7000);
    return () => clearInterval(timer);
  }, [connected, pollState]);

  useEffect(() => {
    window.localStorage.setItem('gf10-camera-ip', ip);
  }, [ip]);

  const togglePhoto = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(photos.map((photo) => photo.id)));
  };

  const downloadSelected = async () => {
    const files = photos.filter((photo) => selected.has(photo.id)).map((photo) => photo.originalFile);
    if (!files.length) return;
    setDownloadLoading(true);
    setError('');
    setNotice(`正在打包 ${files.length} 张原图…`);
    try {
      const response = await fetch(`/api/bridge?action=download&ip=${encodeURIComponent(ip)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as ApiResponse;
        throw new Error(data.error || '下载失败');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GF10-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(`已开始下载 ${files.length} 张原图`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量下载失败');
      setNotice('下载未完成，请重试。');
    } finally {
      setDownloadLoading(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (connection === 'connected') return '已连接';
    if (connection === 'connecting') return '连接中';
    if (connection === 'waiting') return '等待相机确认';
    if (connection === 'error') return '连接失败';
    return '未连接';
  }, [connection]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Zap size={18} strokeWidth={2.5} /></div>
          <div><p className="eyebrow">LUMIX / LOCAL BRIDGE</p><h1>GF10 Photo Desk</h1></div>
        </div>
        <div className={`connection-pill ${connected ? 'is-connected' : ''} ${connection === 'error' ? 'is-error' : ''}`}>
          <span className="status-dot" /><span>{statusLabel}</span><span className="pill-divider" /><span className="mono">{ip}</span>
        </div>
        <div className="top-actions">
          <button className="icon-button menu-trigger" type="button" aria-label="打开菜单" onClick={() => setMenuOpen((value) => !value)}><Menu size={19} /></button>
          <button className="button secondary settings-button" type="button" onClick={() => setSettingsOpen((value) => !value)}><Settings2 size={16} /><span>连接设置</span></button>
        </div>
        {menuOpen && <div className="mobile-menu"><button type="button" onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}>连接设置</button><button type="button" onClick={() => { void loadCatalog(); setMenuOpen(false); }}>刷新目录</button></div>}
      </header>

      <section className="hero-row">
        <div><p className="section-kicker">WIRELESS PHOTO BROWSER</p><h2>从相机到屏幕，<span>只看照片。</span></h2><p className="hero-copy">连接 GF10 的 Wi-Fi 后，预览缩略图、挑选照片，并把原图一次性打包下载。</p>{detectedModel && <p className="detected-line"><span className="live-dot" />当前识别：{detectedModel}{verifiedModels.includes(detectedModel) ? ' · 本机已验证' : ''}</p>}</div>
        <div className="hero-metrics"><div><strong>{photos.length || '—'}</strong><span>相机照片</span></div><div><strong>{selectedCount || '—'}</strong><span>已选择</span></div><div><strong>8.1</strong><span>Mbps 实测</span></div></div>
      </section>

      {settingsOpen && <section className="settings-panel">
        <div className="settings-title"><div className="icon-tile"><Wifi size={18} /></div><div><strong>相机连接</strong><span>页面无法替你切换系统 Wi-Fi，请先连接 GF10 热点。</span></div></div>
        <form className="connect-form" onSubmit={(event) => { event.preventDefault(); void connect(); }}>
          <label htmlFor="camera-ip">相机 IP 地址</label><input id="camera-ip" value={draftIp} onChange={(event) => setDraftIp(event.target.value)} inputMode="decimal" spellCheck={false} />
          <button className="button primary" type="submit" disabled={connection === 'connecting' || connection === 'waiting'}>{connection === 'connecting' ? <LoaderCircle className="spin" size={17} /> : <Wifi size={17} />}{connection === 'waiting' ? '等待确认…' : '连接相机'}</button>
        </form>
        <p className="settings-hint">默认地址 192.168.54.1 · 在相机上选择“遥控拍摄和查看”后确认连接。</p>
        <div className="compatibility-toggle-row"><div><strong>协议兼容型号</strong><span>基于 Panasonic Image App 兼容表整理</span></div><button className="button secondary" type="button" onClick={() => setCompatibilityOpen((value) => !value)}>{compatibilityOpen ? '收起型号' : '查看型号'}</button></div>
        {compatibilityOpen && <div className="compatibility-list">{compatibilityGroups.map((group) => <section className="compatibility-group" key={group.label}><div><strong>{group.label}</strong><span>{group.description}</span></div><div className="model-chips">{group.models.map((model) => <span className={`model-chip ${verifiedModels.includes(model) ? 'is-verified' : ''}`} key={model}>{model}{verifiedModels.includes(model) && <em>已验证</em>}</span>)}</div></section>)}</div>}
      </section>}

      <section className="status-strip" aria-live="polite"><div className="status-message">{connection === 'waiting' ? <LoaderCircle className="spin" size={15} /> : connection === 'connected' ? <Check size={15} /> : <Wifi size={15} />}<span>{notice}</span></div><div className="status-details">{cameraState?.batt && <span>电量 {cameraState.batt}</span>}{cameraState?.cammode && <span>模式 {cameraState.cammode === 'play' ? '回放' : cameraState.cammode}</span>}{cameraState?.version && <span>固件 {cameraState.version}</span>}</div></section>
      {error && <div className="error-banner"><X size={15} />{error}</div>}

      <section className="toolbar"><div className="toolbar-left"><button className={`select-toggle ${allSelected ? 'active' : ''}`} type="button" onClick={toggleAll} disabled={!photos.length}><span className="checkbox-box">{allSelected && <Check size={13} />}</span><span>{allSelected ? '取消全选' : '全选'}</span></button><span className="toolbar-count">{selectedCount ? `已选择 ${selectedCount} 张` : `${photos.length || 0} 张照片`}</span></div><div className="toolbar-right"><button className="button secondary refresh-button" type="button" onClick={() => void loadCatalog()} disabled={!connected || catalogLoading}><RefreshCw className={catalogLoading ? 'spin' : ''} size={16} /><span>刷新</span></button><button className="button primary download-button" type="button" onClick={() => void downloadSelected()} disabled={!selectedCount || downloadLoading}>{downloadLoading ? <LoaderCircle className="spin" size={16} /> : <HardDriveDownload size={16} />}<span>{downloadLoading ? '打包中…' : '下载原图'}</span>{selectedCount > 0 && <b>{selectedCount}</b>}</button></div></section>

      {catalogLoading && !photos.length ? <section className="empty-state loading-state"><LoaderCircle className="spin" size={26} /><strong>正在读取相机照片</strong><span>相机会先切换到回放模式，然后加载缩略图。</span></section> : photos.length ? <section className="photo-grid">{photos.map((photo, index) => { const isSelected = selected.has(photo.id); return <article className={`photo-card ${isSelected ? 'is-selected' : ''}`} key={photo.id}><button className="photo-image-button" type="button" onClick={() => setPreviewIndex(index)} aria-label={`预览 ${photo.title}`}><Image src={cameraAsset(ip, photo.thumbnailFile)} alt={photo.title} fill sizes="(max-width: 600px) 50vw, (max-width: 850px) 33vw, (max-width: 1150px) 25vw, 20vw" unoptimized /><span className="preview-overlay"><ImageIcon size={17} />预览</span></button><button className="card-check" type="button" aria-label={isSelected ? `取消选择 ${photo.title}` : `选择 ${photo.title}`} onClick={() => togglePhoto(photo.id)}><span>{isSelected && <Check size={13} />}</span></button><div className="photo-meta"><div><strong>{photo.title}</strong><span>{formatDate(photo.date)}</span></div><small>{formatBytes(photo.size)}</small></div></article>; })}</section> : <section className="empty-state"><div className="empty-icon"><ImageIcon size={24} /></div><strong>还没有照片目录</strong><span>打开右上角“连接设置”，确认相机已连接 GF10 Wi-Fi。</span><button className="button primary" type="button" onClick={() => setSettingsOpen(true)}><Wifi size={16} />开始连接</button></section>}

      <footer className="footer-note"><span className="live-dot" />本地连接 · 只读访问 · 不修改相机内容</footer>

      {previewPhoto && previewIndex !== null && <dialog open className="lightbox" aria-label="照片预览"><div className="lightbox-inner"><div className="lightbox-bar"><div><strong>{previewPhoto.title}</strong><span>{formatBytes(previewPhoto.size)} · {formatDate(previewPhoto.date)}</span></div><button className="icon-button" type="button" onClick={() => setPreviewIndex(null)} aria-label="关闭预览"><X size={20} /></button></div><div className="lightbox-image-wrap"><Image src={cameraAsset(ip, previewPhoto.previewFile)} alt={previewPhoto.title} width={1600} height={1200} unoptimized /></div><div className="lightbox-controls"><button className="icon-button" type="button" disabled={previewIndex <= 0} onClick={() => setPreviewIndex((index) => index === null ? null : Math.max(0, index - 1))} aria-label="上一张"><ChevronLeft size={20} /></button><span>{previewIndex + 1} / {photos.length}</span><button className="icon-button" type="button" disabled={previewIndex >= photos.length - 1} onClick={() => setPreviewIndex((index) => index === null ? null : Math.min(photos.length - 1, index + 1))} aria-label="下一张"><ChevronRight size={20} /></button></div></div></dialog>}
    </main>
  );
}
