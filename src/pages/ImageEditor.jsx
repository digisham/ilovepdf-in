import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    FiUploadCloud, FiDownload, FiCrop, FiZap, FiTrash2,
    FiMaximize2, FiZoomIn, FiZoomOut, FiRefreshCw, FiCheck, FiArrowLeft, FiImage
} from 'react-icons/fi';

/* ─── Constants ─────────────────────────────────── */
const UNITS = ['px', 'cm', 'in'];
const PX_CM = 37.7953;
const PX_IN = 96;
const HANDLE_R = 7;
const PRESETS = [
    { label: 'Original', w: null, h: null },
    { label: 'HD 1280×720', w: 1280, h: 720 },
    { label: 'Full HD 1920×1080', w: 1920, h: 1080 },
    { label: 'Square 1:1', w: 1080, h: 1080 },
    { label: 'Instagram Post', w: 1080, h: 1350 },
    { label: 'Twitter Banner', w: 1500, h: 500 },
    { label: 'Facebook Cover', w: 820, h: 312 },
    { label: 'A4 300dpi', w: 2480, h: 3508 },
];

function toPx(v, u) { const n = parseFloat(v) || 0; return u === 'cm' ? Math.round(n * PX_CM) : u === 'in' ? Math.round(n * PX_IN) : Math.round(n); }
function fromPx(px, u) { return u === 'cm' ? (px / PX_CM).toFixed(2) : u === 'in' ? (px / PX_IN).toFixed(2) : Math.round(px); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmtBytes(b) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`; }
function dataUrlBytes(url) { return Math.round((url.length - url.indexOf(',') - 1) * 0.75); }

/* ─── Drop Zone Skeleton (shown before image load) ─── */
function DropSkeleton({ onFile, isDragging, setIsDragging, fileRef }) {
    return (
        <div
            className={`ie-drop-skeleton ${isDragging ? 'ie-drop-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); onFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
        >
            {/* Skeleton shimmer rectangles to simulate canvas */}
            <div className="ie-skel-img">
                <div className="ie-skel-bar ie-skel-bar--tall" />
                <div className="ie-skel-bar ie-skel-bar--short" />
            </div>
            <div className="ie-drop-cta">
                <div className="ie-drop-icon-circle">
                    <FiUploadCloud size={30} />
                </div>
                <p className="ie-drop-label">Drop an image here</p>
                <p className="ie-drop-sub">or click to select &nbsp;·&nbsp; JPG &nbsp;PNG &nbsp;WEBP</p>
            </div>
        </div>
    );
}

/* ─── Metadata Skeleton (shown before image load) ─── */
function MetaSkeleton() {
    return (
        <div className="ie-meta-skeleton">
            <div className="ie-ms-title">Image Metadata</div>
            {['Filename', 'Dimensions', 'File size', 'Format', 'Color space'].map(label => (
                <div key={label} className="ie-ms-row">
                    <span className="ie-ms-label">{label}</span>
                    <span className="ie-ms-val ie-ms-val--empty">—</span>
                </div>
            ))}
            <div className="ie-ms-hint">Load an image to see details and editing options</div>
        </div>
    );
}

/* ─── Collapsible Metadata Card ─── */
function CollapsibleMeta({ rows }) {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="ie-collapsible-meta">
            <button className="ie-cm-toggle" onClick={() => setOpen(o => !o)}>
                <span>📋 Image Details</span>
                <span className={`ie-cm-arrow ${open ? 'open' : ''}`}>▾</span>
            </button>
            {open && (
                <div className="ie-cm-body">
                    {rows.map(([label, val, style]) => (
                        <div key={label} className="ie-meta-row">
                            <span>{label}</span>
                            <strong className="text-truncate" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(style || {}) }}>{val}</strong>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════ */
export default function ImageEditor() {
    const [src, setSrc] = useState(null);
    const [origW, setOrigW] = useState(0);
    const [origH, setOrigH] = useState(0);
    const [origName, setOrigName] = useState('');
    const [tab, setTab] = useState('resize');
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef(null);
    const imgRef = useRef(new window.Image());

    /* resize */
    const [unit, setUnit] = useState('px');
    const [lockRatio, setLockRatio] = useState(true);
    const [rW, setRW] = useState('');
    const [rH, setRH] = useState('');

    /* crop */
    const cropCanvasRef = useRef(null);
    const cropWrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [cropInfo, setCropInfo] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [croppedSrc, setCroppedSrc] = useState(null);
    const [croppedMeta, setCroppedMeta] = useState(null);
    const cropState = useRef({
        box: { x: 0, y: 0, w: 0, h: 0 }, mode: 'idle', handle: null,
        startX: 0, startY: 0, origBox: null, scale: 1,
    });

    /* compress */
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState('jpeg');
    const [compressedSize, setCompressedSize] = useState(null);
    const [origFileSize, setOrigFileSize] = useState(null);
    const [targetKB, setTargetKB] = useState('');
    const [autoQuality, setAutoQuality] = useState(null);

    /* resize target-size */
    const [resizeTargetKB, setResizeTargetKB] = useState('');
    const [resizeAction, setResizeAction] = useState(null); // null | 'decrease' | 'increase'
    const [resizeAutoQ, setResizeAutoQ] = useState(null); // auto quality found

    /* ── Load image ── */
    useEffect(() => {
        if (!src) return;
        imgRef.current.onload = () => {
            const iw = imgRef.current.naturalWidth;
            const ih = imgRef.current.naturalHeight;
            setOrigW(iw); setOrigH(ih);
            setRW(fromPx(iw, unit)); setRH(fromPx(ih, unit));
            cropState.current.box = { x: 0, y: 0, w: iw, h: ih };
            setCropInfo({ x: 0, y: 0, w: iw, h: ih });
            setCroppedSrc(null); setCroppedMeta(null);
            setZoom(1);
        };
        imgRef.current.src = src;
    }, [src]);

    useEffect(() => { if (!origW) return; setRW(fromPx(origW, unit)); setRH(fromPx(origH, unit)); }, [unit]);
    useEffect(() => { if (tab === 'crop' && origW) setTimeout(renderCrop, 50); }, [tab, origW, zoom]);

    const loadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setOrigFileSize(file.size);
        setOrigName(file.name);
        const r = new FileReader();
        r.onload = e => setSrc(e.target.result);
        r.readAsDataURL(file);
    };

    /* ── CROP RENDER ── */
    const renderCrop = useCallback(() => {
        const canvas = cropCanvasRef.current;
        if (!canvas || !imgRef.current.naturalWidth) return;
        const wrap = cropWrapRef.current;
        const maxW = (wrap ? wrap.clientWidth : 700) - 4;
        const maxH = (wrap ? wrap.clientHeight : 500) - 4;
        const iw = imgRef.current.naturalWidth;
        const ih = imgRef.current.naturalHeight;
        const baseS = Math.min(maxW / iw, maxH / ih, 1);
        const scale = baseS * zoom;
        cropState.current.scale = scale;

        canvas.width = Math.round(iw * scale);
        canvas.height = Math.round(ih * scale);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);

        const { box } = cropState.current;
        if (box.w > 0 && box.h > 0) {
            const bx = box.x * scale, by = box.y * scale, bw = box.w * scale, bh = box.h * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.rect(bx, by, bw, bh); ctx.fill('evenodd');
            ctx.drawImage(imgRef.current, box.x, box.y, box.w, box.h, bx, by, bw, bh);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.7;
            for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(bx + bw * i / 3, by); ctx.lineTo(bx + bw * i / 3, by + bh); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx, by + bh * i / 3); ctx.lineTo(bx + bw, by + bh * i / 3); ctx.stroke(); }
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
            [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh], [bx + bw / 2, by], [bx + bw / 2, by + bh], [bx, by + bh / 2], [bx + bw, by + bh / 2]].forEach(([hx, hy]) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, HANDLE_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
            ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 11px Inter,sans-serif';
            ctx.fillText(`${Math.round(box.w)}×${Math.round(box.h)}px`, clamp(bx + 4, 4, canvas.width - 80), clamp(by - 8, 14, canvas.height - 4));
        }
    }, [zoom]);

    /* ── Mouse ── */
    const canvasPt = (e) => {
        const canvas = cropCanvasRef.current; const rect = canvas.getBoundingClientRect(); const s = cropState.current.scale;
        return { ix: clamp((e.clientX - rect.left) / s, 0, origW), iy: clamp((e.clientY - rect.top) / s, 0, origH), cx: e.clientX - rect.left, cy: e.clientY - rect.top };
    };
    const hitHandle = (cx, cy) => {
        const { box, scale } = cropState.current; const [bx, by, bw, bh] = [box.x * scale, box.y * scale, box.w * scale, box.h * scale];
        const pts = { tl: [bx, by], tr: [bx + bw, by], bl: [bx, by + bh], br: [bx + bw, by + bh], tm: [bx + bw / 2, by], bm: [bx + bw / 2, by + bh], ml: [bx, by + bh / 2], mr: [bx + bw, by + bh / 2] };
        for (const [id, [hx, hy]] of Object.entries(pts)) if (Math.hypot(cx - hx, cy - hy) <= HANDLE_R + 4) return id;
        return null;
    };
    const getCursor = (cx, cy) => {
        const h = hitHandle(cx, cy);
        if (h) { const m = { tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize', tm: 'n-resize', bm: 's-resize', ml: 'w-resize', mr: 'e-resize' }; return m[h]; }
        const { box, scale } = cropState.current;
        if (cx >= box.x * scale && cx <= (box.x + box.w) * scale && cy >= box.y * scale && cy <= (box.y + box.h) * scale) return 'move';
        return 'crosshair';
    };
    const onMouseDown = (e) => {
        if (e.button !== 0) return;
        const { ix, iy, cx, cy } = canvasPt(e); const cs = cropState.current; const h = hitHandle(cx, cy);
        if (h) { cs.mode = 'resize'; cs.handle = h; cs.origBox = { ...cs.box }; cs.startX = ix; cs.startY = iy; }
        else {
            const inBox = ix >= cs.box.x && ix <= cs.box.x + cs.box.w && iy >= cs.box.y && iy <= cs.box.y + cs.box.h;
            if (inBox) { cs.mode = 'move'; cs.origBox = { ...cs.box }; cs.startX = ix; cs.startY = iy; }
            else { cs.mode = 'draw'; cs.startX = ix; cs.startY = iy; cs.box = { x: ix, y: iy, w: 0, h: 0 }; }
        }
        e.preventDefault();
    };
    const onMouseMove = useCallback((e) => {
        const canvas = cropCanvasRef.current; if (!canvas) return;
        const { ix, iy, cx, cy } = canvasPt(e); const cs = cropState.current;
        if (cs.mode === 'idle') { canvas.style.cursor = getCursor(cx, cy); return; }
        if (cs.mode === 'draw') { const x = Math.min(cs.startX, ix), y = Math.min(cs.startY, iy), w = Math.abs(ix - cs.startX), h = Math.abs(iy - cs.startY); cs.box = { x: clamp(x, 0, origW), y: clamp(y, 0, origH), w: clamp(w, 1, origW - clamp(x, 0, origW)), h: clamp(h, 1, origH - clamp(y, 0, origH)) }; }
        else if (cs.mode === 'move') { const dx = ix - cs.startX, dy = iy - cs.startY; cs.box = { x: clamp(cs.origBox.x + dx, 0, origW - cs.origBox.w), y: clamp(cs.origBox.y + dy, 0, origH - cs.origBox.h), w: cs.origBox.w, h: cs.origBox.h }; }
        else if (cs.mode === 'resize') { let { x, y, w, h } = cs.origBox; const hid = cs.handle; const dx = ix - cs.startX, dy = iy - cs.startY; if (hid.includes('r')) { w = clamp(w + dx, 1, origW - x); } if (hid.includes('l')) { const nw = clamp(w - dx, 1, x + w); x = x + w - nw; w = nw; } if (hid.includes('b')) { h = clamp(h + dy, 1, origH - y); } if (hid.includes('t')) { const nh = clamp(h - dy, 1, y + h); y = y + h - nh; h = nh; } cs.box = { x, y, w, h }; }
        renderCrop();
    }, [origW, origH, renderCrop]);
    const onMouseUp = useCallback(() => { const cs = cropState.current; if (cs.mode !== 'idle') { if (cs.box.w < 1) cs.box.w = 1; if (cs.box.h < 1) cs.box.h = 1; cs.mode = 'idle'; setCropInfo({ ...cs.box }); renderCrop(); } }, [renderCrop]);
    useEffect(() => { window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); }; }, [onMouseMove, onMouseUp]);

    /* ── Crop actions ── */
    const applyCrop = () => {
        const { x, y, w, h } = cropState.current.box; if (w < 1 || h < 1) return;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(imgRef.current, x, y, w, h, 0, 0, w, h);
        const url = c.toDataURL(`image/${format}`, quality / 100);
        setCroppedSrc(url); setCroppedMeta({ w, h, size: dataUrlBytes(url), format });
    };
    const resetCrop = () => {
        setCroppedSrc(null); setCroppedMeta(null);
        cropState.current.box = { x: 0, y: 0, w: origW, h: origH };
        setCropInfo({ x: 0, y: 0, w: origW, h: origH }); setTimeout(renderCrop, 30);
    };
    const applyInputs = (nx, ny, nw, nh) => {
        const x = clamp(parseInt(nx) || 0, 0, origW - 1), y = clamp(parseInt(ny) || 0, 0, origH - 1);
        const w = clamp(parseInt(nw) || 1, 1, origW - x), h = clamp(parseInt(nh) || 1, 1, origH - y);
        cropState.current.box = { x, y, w, h }; setCropInfo({ x, y, w, h }); renderCrop();
    };
    const applyQuickCrop = (mode) => {
        let b;
        if (mode === 'square') { const s = Math.min(origW, origH); b = { x: 0, y: 0, w: s, h: s }; }
        else if (mode === '16:9') { b = { x: 0, y: 0, w: origW, h: clamp(Math.round(origW * 9 / 16), 1, origH) }; }
        else if (mode === '4:3') { b = { x: 0, y: 0, w: origW, h: clamp(Math.round(origW * 3 / 4), 1, origH) }; }
        else { b = { x: 0, y: 0, w: origW, h: origH }; }
        cropState.current.box = b; setCropInfo(b); renderCrop();
    };

    /* ── Compress ── */
    const calcCompressed = useCallback(() => {
        if (!src) return;
        const c = document.createElement('canvas'); c.width = origW; c.height = origH;
        c.getContext('2d').drawImage(imgRef.current, 0, 0);
        setCompressedSize(dataUrlBytes(c.toDataURL(`image/${format}`, quality / 100)));
    }, [src, quality, format, origW, origH]);
    useEffect(() => { if (tab === 'compress') calcCompressed(); }, [tab, quality, format, calcCompressed]);

    const parseTargetBytes = (val) => {
        if (!val) return null;
        const s = String(val).trim().toLowerCase();
        const num = parseFloat(s);
        if (isNaN(num) || num <= 0) return null;
        if (s.includes('mb')) return Math.round(num * 1048576);
        if (s.includes('kb') || s.includes('k')) return Math.round(num * 1024);
        // bare number → treat as KB
        return Math.round(num * 1024);
    };

    const findQualityForTarget = () => {
        const targetBytes = parseTargetBytes(targetKB);
        if (!targetBytes || !src) return;
        const c = document.createElement('canvas');
        c.width = origW; c.height = origH;
        c.getContext('2d').drawImage(imgRef.current, 0, 0);
        // check if max quality is already under target
        const fullBytes = dataUrlBytes(c.toDataURL(`image/${format}`, 1.0));
        if (fullBytes <= targetBytes) {
            setQuality(100); setAutoQuality(100);
        } else {
            let lo = 1, hi = 100, best = 1;
            for (let i = 0; i < 15; i++) {
                const mid = Math.round((lo + hi) / 2);
                const bytes = dataUrlBytes(c.toDataURL(`image/${format}`, mid / 100));
                if (bytes <= targetBytes) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
            }
            setQuality(best); setAutoQuality(best);
        }
        calcCompressed();
    };

    /* ── Resize ── */
    const handleRWChange = v => { setRW(v); if (lockRatio && origW && origH) setRH(fromPx(toPx(v, unit) * (origH / origW), unit)); };
    const handleRHChange = v => { setRH(v); if (lockRatio && origW && origH) setRW(fromPx(toPx(v, unit) * (origW / origH), unit)); };

    /* ── Resize: analyse target size ── */
    const analyzeResizeTarget = () => {
        const targetBytes = parseFloat(resizeTargetKB.replace(/mb/i, '')) * (resizeTargetKB.toLowerCase().includes('mb') ? 1048576 : 1024);
        if (!targetBytes || !src) return;
        const w = toPx(rW, unit) || origW, h = toPx(rH, unit) || origH;
        // estimate at 100% quality
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(imgRef.current, 0, 0, w, h);
        const fullBytes = dataUrlBytes(c.toDataURL(`image/${format}`, 1.0));
        if (fullBytes <= targetBytes) {
            // output smaller than target → need to INCREASE (upscale dimensions)
            setResizeAction('increase');
            setResizeAutoQ(100);
        } else {
            // output bigger than target → need to DECREASE quality
            let lo = 5, hi = 95, best = 50;
            for (let i = 0; i < 12; i++) {
                const mid = Math.round((lo + hi) / 2);
                const bytes = dataUrlBytes(c.toDataURL(`image/${format}`, mid / 100));
                if (bytes <= targetBytes) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
            }
            setResizeAction('decrease');
            setResizeAutoQ(best);
        }
    };

    /* ── Resize: smart action download ── */
    const downloadResizeAction = () => {
        const w = toPx(rW, unit) || origW, h = toPx(rH, unit) || origH;
        let finalW = w, finalH = h, q = resizeAutoQ ?? 100;
        if (resizeAction === 'increase') {
            // scale up to meet target: try 2x, 3x…
            const targetBytes = parseFloat(resizeTargetKB.replace(/mb/i, '')) * (resizeTargetKB.toLowerCase().includes('mb') ? 1048576 : 1024);
            let scale = 1;
            for (let s = 1.1; s <= 5; s += 0.1) {
                const tw = Math.round(w * s), th = Math.round(h * s);
                const c2 = document.createElement('canvas'); c2.width = tw; c2.height = th;
                c2.getContext('2d').drawImage(imgRef.current, 0, 0, tw, th);
                const bytes = dataUrlBytes(c2.toDataURL(`image/${format}`, 1.0));
                if (bytes >= targetBytes) { scale = s; break; }
            }
            finalW = Math.round(w * scale); finalH = Math.round(h * scale); q = 100;
        }
        const c = document.createElement('canvas'); c.width = finalW; c.height = finalH;
        c.getContext('2d').drawImage(imgRef.current, 0, 0, finalW, finalH);
        const a = document.createElement('a');
        a.download = `output_${finalW}x${finalH}.${ext()}`;
        a.href = c.toDataURL(`image/${format}`, q / 100);
        a.click();
    };

    /* ── Download ── */
    const ext = () => format === 'jpeg' ? 'jpg' : format;
    const dl = (canvas, name) => { const a = document.createElement('a'); a.download = name; a.href = canvas.toDataURL(`image/${format}`, quality / 100); a.click(); };
    const downloadResized = () => { const w = toPx(rW, unit), h = toPx(rH, unit); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(imgRef.current, 0, 0, w, h); dl(c, `resized_${w}x${h}.${ext()}`); };
    const downloadCropped = () => { const a = document.createElement('a'); a.download = `cropped_${croppedMeta.w}x${croppedMeta.h}.${ext()}`; a.href = croppedSrc; a.click(); };
    const downloadCompressed = () => { const c = document.createElement('canvas'); c.width = origW; c.height = origH; c.getContext('2d').drawImage(imgRef.current, 0, 0); dl(c, `compressed.${ext()}`); };

    const saving = origFileSize && compressedSize ? Math.max(0, Math.round((1 - compressedSize / origFileSize) * 100)) : 0;

    /* ═══════════════════ RENDER ═══════════════════ */
    return (
        <div className="ie-shell">
            <input ref={fileRef} type="file" accept="image/*" className="d-none"
                onChange={e => loadFile(e.target.files[0])} />

            {/* ── Tab Header ── */}
            <div className="ie-header">
                <div className="ie-tabs">
                    {[
                        { id: 'resize', label: 'Resize', icon: <FiMaximize2 size={14} /> },
                        { id: 'crop', label: 'Crop', icon: <FiCrop size={14} /> },
                        { id: 'compress', label: 'Compress', icon: <FiZap size={14} /> },
                    ].map(t => (
                        <button key={t.id} className={`ie-tab ${tab === t.id ? 'active' : ''}`}
                            onClick={() => { setTab(t.id); if (t.id === 'crop' && src) resetCrop(); }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {src && <span className="ie-meta">{origW} × {origH} px &nbsp;·&nbsp; {origFileSize ? fmtBytes(origFileSize) : ''}</span>}
                    {src ? (
                        <>
                            <button className="tp-back-btn" onClick={() => fileRef.current.click()}>
                                <FiUploadCloud size={13} /> New image
                            </button>
                            <button className="tp-back-btn" style={{ color: '#e53935', borderColor: '#fecaca' }} onClick={() => { setSrc(null); setOrigW(0); setOrigH(0); }}>
                                <FiTrash2 size={13} /> Clear
                            </button>
                        </>
                    ) : (
                        <button className="tp-back-btn" style={{ background: '#e53935', color: '#fff', borderColor: '#e53935' }}
                            onClick={() => fileRef.current.click()}>
                            <FiUploadCloud size={13} /> Open image
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="ie-body">

                {/* ══ RESIZE ══ */}
                {tab === 'resize' && (<>
                    {/* Preview / Drop zone */}
                    <div className="ie-preview-pane">
                        {src ? (
                            <img src={src} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
                        ) : (
                            <DropSkeleton onFile={loadFile} isDragging={isDragging} setIsDragging={setIsDragging} fileRef={fileRef} />
                        )}
                    </div>

                    {/* Resize controls */}
                    <div className="ie-controls-pane">
                        <div className="ie-section-title"><FiMaximize2 size={14} /> Resize</div>

                        {/* Scrollable body */}
                        <div className="ie-ctrl-scroll">
                            {src ? (<>
                                <div className="tp-settings-label mt-2">Unit</div>
                                <div className="tp-toggle-group">
                                    {UNITS.map(u => <button key={u} className={`tp-toggle-btn ${unit === u ? 'active' : ''}`} onClick={() => setUnit(u)}>{u}</button>)}
                                </div>

                                <div className="tp-settings-label mt-3">Dimensions</div>
                                <div className="ie-dim-row">
                                    <div className="ie-dim-group"><label>Width</label>
                                        <input className="ie-input" type="number" min="1" value={rW} onChange={e => handleRWChange(e.target.value)} />
                                        <span className="ie-unit-tag">{unit}</span>
                                    </div>
                                    <button className={`ie-lock-btn ${lockRatio ? 'active' : ''}`} title="Lock ratio" onClick={() => setLockRatio(!lockRatio)}>🔗</button>
                                    <div className="ie-dim-group"><label>Height</label>
                                        <input className="ie-input" type="number" min="1" value={rH} onChange={e => handleRHChange(e.target.value)} />
                                        <span className="ie-unit-tag">{unit}</span>
                                    </div>
                                </div>

                                <div className="tp-settings-label mt-3">Format</div>
                                <div className="tp-toggle-group">
                                    {['jpeg', 'png', 'webp'].map(f => <button key={f} className={`tp-toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f.toUpperCase()}</button>)}
                                </div>

                                <div className="tp-settings-label mt-3">Presets</div>
                                <div className="ie-presets">
                                    {PRESETS.map(p => (
                                        <button key={p.label} className="ie-preset-chip" onClick={() => { if (!p.w) { setRW(fromPx(origW, unit)); setRH(fromPx(origH, unit)); } else { setRW(fromPx(p.w, unit)); setRH(fromPx(p.h, unit)); } }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <CollapsibleMeta rows={[
                                    ['Filename', origName || '—'],
                                    ['Original', `${origW} × ${origH} px`],
                                    ['Output', `${toPx(rW, unit)} × ${toPx(rH, unit)} px`],
                                    ['Format', format.toUpperCase()],
                                    ['File size', origFileSize ? fmtBytes(origFileSize) : '—'],
                                ]} />

                                {/* Target file size */}
                                <div className="tp-settings-label mt-3">Target File Size</div>
                                <div className="ie-target-row">
                                    <input
                                        className="ie-input"
                                        type="text"
                                        placeholder="e.g. 200kb or 2mb"
                                        value={resizeTargetKB}
                                        onChange={e => { setResizeTargetKB(e.target.value); setResizeAction(null); }}
                                        onKeyDown={e => e.key === 'Enter' && analyzeResizeTarget()}
                                    />
                                    <button className="ie-apply-btn" onClick={analyzeResizeTarget}>Analyse</button>
                                </div>
                                {resizeAction === 'decrease' && (
                                    <div className="ie-action-hint ie-action-hint--red">
                                        ⬇ Image is larger than target. Will reduce quality to ~{resizeAutoQ}% to fit.
                                    </div>
                                )}
                                {resizeAction === 'increase' && (
                                    <div className="ie-action-hint ie-action-hint--blue">
                                        ⬆ Image is smaller than target. Will upscale dimensions to reach target size.
                                    </div>
                                )}
                            </>) : <MetaSkeleton />}
                        </div>

                        {/* Pinned footer */}
                        {src && (
                            <div className="ie-ctrl-footer">
                                {resizeAction && (
                                    <button
                                        className="tp-convert-btn"
                                        style={{
                                            background: resizeAction === 'decrease'
                                                ? 'linear-gradient(135deg,#e53935,#ff6f61)'
                                                : 'linear-gradient(135deg,#3b82f6,#6366f1)'
                                        }}
                                        onClick={downloadResizeAction}
                                    >
                                        <FiDownload size={15} />
                                        {resizeAction === 'decrease' ? 'Decrease Quality & Download' : 'Increase Size & Download'}
                                    </button>
                                )}
                                <button className="tp-convert-btn" style={{ background: '#f3f4f6', color: '#374151', boxShadow: 'none', border: '1px solid #e5e7eb' }} onClick={downloadResized}>
                                    <FiDownload size={15} /> Download at current size
                                </button>
                            </div>
                        )}
                    </div>
                </>)}

                {/* ══ CROP ══ */}
                {tab === 'crop' && (<>
                    <div className="ie-preview-pane ie-crop-pane" ref={cropWrapRef}>
                        {src ? (<>
                            <div className="ie-crop-toolbar">
                                <span className="ie-crop-hint-text">{croppedSrc ? '✅ Crop applied' : 'Click & drag to select crop area'}</span>
                                <div className="ie-zoom-controls">
                                    <button className="ie-zoom-btn" onClick={() => setZoom(z => clamp(parseFloat((z - 0.1).toFixed(1)), 0.2, 4))}><FiZoomOut size={15} /></button>
                                    <span className="ie-zoom-label">{Math.round(zoom * 100)}%</span>
                                    <button className="ie-zoom-btn" onClick={() => setZoom(z => clamp(parseFloat((z + 0.1).toFixed(1)), 0.2, 4))}><FiZoomIn size={15} /></button>
                                    <button className="ie-zoom-btn" onClick={() => setZoom(1)}><FiRefreshCw size={13} /></button>
                                </div>
                            </div>
                            <div className="ie-canvas-scroll">
                                {croppedSrc
                                    ? <img src={croppedSrc} alt="cropped" className="ie-cropped-preview" />
                                    : <canvas ref={cropCanvasRef} style={{ display: 'block', userSelect: 'none', cursor: 'crosshair', borderRadius: 4 }} onMouseDown={onMouseDown} />
                                }
                            </div>
                        </>) : (
                            <DropSkeleton onFile={loadFile} isDragging={isDragging} setIsDragging={setIsDragging} fileRef={fileRef} />
                        )}
                    </div>

                    <div className="ie-controls-pane">
                        <div className="ie-section-title"><FiCrop size={14} /> Crop</div>

                        {src ? (!croppedSrc ? (<>
                            {/* Scrollable body */}
                            <div className="ie-ctrl-scroll">
                                <div className="tp-settings-label mt-2">Selection (px)</div>
                                <div className="ie-crop-grid">
                                    {[['X', cropInfo.x], ['Y', cropInfo.y], ['W', cropInfo.w], ['H', cropInfo.h]].map(([label, val], i) => (
                                        <div key={label} className="ie-dim-group"><label>{label}</label>
                                            <input className="ie-input" type="number" min="0" value={Math.round(val)}
                                                onChange={e => { const v = parseInt(e.target.value) || 0; const ni = { ...cropInfo }; if (i === 0) ni.x = v; if (i === 1) ni.y = v; if (i === 2) ni.w = v; if (i === 3) ni.h = v; setCropInfo(ni); }}
                                                onBlur={() => applyInputs(cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h)}
                                                onKeyDown={e => e.key === 'Enter' && applyInputs(cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h)} />
                                        </div>
                                    ))}
                                </div>
                                <button className="ie-apply-btn mt-2" onClick={() => applyInputs(cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h)}>Apply values</button>

                                <div className="tp-settings-label mt-3">Quick Crop</div>
                                <div className="ie-presets">
                                    {[['Square', 'square'], ['16:9', '16:9'], ['4:3', '4:3'], ['Full', 'full']].map(([l, m]) => (
                                        <button key={l} className="ie-preset-chip" onClick={() => applyQuickCrop(m)}>{l}</button>
                                    ))}
                                </div>

                                <div className="tp-settings-label mt-3">Format</div>
                                <div className="tp-toggle-group">
                                    {['jpeg', 'png', 'webp'].map(f => <button key={f} className={`tp-toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f.toUpperCase()}</button>)}
                                </div>

                                <CollapsibleMeta rows={[
                                    ['Filename', origName || '—'],
                                    ['Selection', `${Math.round(cropInfo.w)} × ${Math.round(cropInfo.h)} px`],
                                    ['Offset', `(${Math.round(cropInfo.x)}, ${Math.round(cropInfo.y)})`],
                                    ['Original', `${origW} × ${origH} px`],
                                    ['File size', origFileSize ? fmtBytes(origFileSize) : '—'],
                                ]} />
                            </div>

                            {/* Pinned footer */}
                            <div className="ie-ctrl-footer">
                                <button className="tp-convert-btn" onClick={applyCrop}
                                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                    <FiCheck size={17} /> Apply Crop
                                </button>
                            </div>
                        </>) : (<>
                            {/* After crop applied */}
                            <div className="ie-ctrl-scroll">
                                <div className="ie-crop-done-badge">✅ Crop applied</div>

                                <div className="tp-settings-label mt-3">Format</div>
                                <div className="tp-toggle-group">
                                    {['jpeg', 'png', 'webp'].map(f => <button key={f} className={`tp-toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f.toUpperCase()}</button>)}
                                </div>

                                <CollapsibleMeta rows={[
                                    ['Filename', origName || '—'],
                                    ['Cropped', `${croppedMeta.w} × ${croppedMeta.h} px`],
                                    ['Output ~', fmtBytes(croppedMeta.size), { color: '#10b981' }],
                                    ['Original', `${origW} × ${origH} px`],
                                    ['Format', format.toUpperCase()],
                                ]} />
                            </div>

                            <div className="ie-ctrl-footer">
                                <button className="tp-convert-btn" onClick={downloadCropped}><FiDownload size={17} /> Download Cropped</button>
                                <button className="ie-apply-btn" onClick={resetCrop}><FiArrowLeft size={13} /> Re-crop image</button>
                            </div>
                        </>)) : <MetaSkeleton />}
                    </div>
                </>)}

                {/* ══ COMPRESS ══ */}
                {tab === 'compress' && (<>
                    <div className="ie-preview-pane">
                        {src
                            ? <img src={src} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
                            : <DropSkeleton onFile={loadFile} isDragging={isDragging} setIsDragging={setIsDragging} fileRef={fileRef} />
                        }
                    </div>

                    <div className="ie-controls-pane">
                        <div className="ie-section-title"><FiZap size={14} /> Compress</div>

                        {src ? (<>
                            <div className="ie-ctrl-scroll">
                                <div className="tp-settings-label mt-2">Format</div>
                                <div className="tp-toggle-group">
                                    {['jpeg', 'png', 'webp'].map(f => <button key={f} className={`tp-toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f.toUpperCase()}</button>)}
                                </div>

                                <div className="tp-settings-label mt-3">Quality — <strong>{quality}%</strong></div>
                                <input type="range" min="5" max="100" step="1" value={quality}
                                    onChange={e => { setQuality(Number(e.target.value)); setAutoQuality(null); }} className="ie-range mb-1" />
                                <div className="d-flex justify-content-between" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                    <span>Smallest</span><span>Best quality</span>
                                </div>

                                <div className="tp-settings-label mt-3">Target File Size</div>
                                <div className="ie-target-row">
                                    <input
                                        className="ie-input"
                                        type="text"
                                        placeholder="e.g. 200kb or 1.5mb"
                                        value={targetKB}
                                        onChange={e => { setTargetKB(e.target.value); setAutoQuality(null); }}
                                        onKeyDown={e => e.key === 'Enter' && findQualityForTarget()}
                                    />
                                    <button className="ie-apply-btn" onClick={findQualityForTarget}>Apply</button>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
                                    Enter KB or MB — e.g. <strong>200kb</strong>, <strong>1mb</strong>, <strong>500</strong>
                                </div>
                                {autoQuality !== null && (
                                    <div className={`ie-action-hint ${autoQuality >= 90 ? 'ie-action-hint--blue' : autoQuality >= 50 ? 'ie-action-hint--orange' : 'ie-action-hint--red'}`}>
                                        {autoQuality >= 90
                                            ? `✅ Image already fits target at ${autoQuality}% quality`
                                            : `⬇ Quality set to ${autoQuality}% to meet target size`
                                        }
                                    </div>
                                )}

                                <div className="ie-size-compare mt-3">
                                    <div className="ie-size-block"><div className="ie-size-label">Original</div><div className="ie-size-val">{origFileSize ? fmtBytes(origFileSize) : '—'}</div></div>
                                    <div className="ie-size-arrow">→</div>
                                    <div className="ie-size-block"><div className="ie-size-label">Output</div><div className="ie-size-val" style={{ color: '#10b981' }}>{compressedSize ? fmtBytes(compressedSize) : '—'}</div></div>
                                </div>
                                {saving > 0 && <div className="ie-saving-badge">🎉 {saving}% smaller</div>}

                                <CollapsibleMeta rows={[
                                    ['Filename', origName || '—'],
                                    ['Dimensions', `${origW} × ${origH} px`],
                                    ['Format', format.toUpperCase()],
                                    ['Quality', `${quality}%`],
                                    ['Original', origFileSize ? fmtBytes(origFileSize) : '—'],
                                    ['Output ~', compressedSize ? fmtBytes(compressedSize) : '—', { color: '#10b981' }],
                                ]} />
                            </div>

                            <div className="ie-ctrl-footer">
                                <button className="tp-convert-btn" onClick={downloadCompressed}><FiDownload size={17} /> Download Compressed</button>
                            </div>
                        </>) : <MetaSkeleton />}
                    </div>
                </>)}

            </div>
        </div>
    );
}
