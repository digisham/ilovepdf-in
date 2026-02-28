import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import {
    FiUploadCloud, FiDownload, FiTrash2, FiArrowLeft,
    FiScissors, FiLayers, FiList, FiGrid, FiCheck,
    FiPackage
} from 'react-icons/fi';
import { PDFDocument } from 'pdf-lib';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtBytes = (b) => {
    if (!b) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(2)} MB`;
};

const parseRanges = (str, total) => {
    const pages = new Set();
    str.split(',').forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const [a, b] = trimmed.split('-').map(n => parseInt(n.trim()));
        if (isNaN(a)) return;
        const start = Math.max(1, a);
        const end = isNaN(b) ? start : Math.max(start, b);
        for (let i = start; i <= Math.min(end, total); i++) pages.add(i - 1);
    });
    return [...pages].sort((a, b) => a - b);
};

const chunkArray = (arr, n) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += n) chunks.push(arr.slice(i, i + n));
    return chunks;
};

/* ─────────────────────────────────────────
   PDF.js CDN loader (cached)
───────────────────────────────────────── */
let _pdfjsLib = null;
const loadPdfJs = () => new Promise((resolve, reject) => {
    if (_pdfjsLib) return resolve(_pdfjsLib);
    if (window.pdfjsLib) {
        _pdfjsLib = window.pdfjsLib;
        _pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return resolve(_pdfjsLib);
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
        _pdfjsLib = window.pdfjsLib;
        _pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(_pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
});

/* ─────────────────────────────────────────
   PageThumb
───────────────────────────────────────── */
const PageThumb = ({ pdfDoc, pageNum, selected, onClick }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!pdfDoc) return;
        let cancelled = false;
        (async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const vp = page.getViewport({ scale: 0.32 });
                const c = canvasRef.current;
                if (!c || cancelled) return;
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            } catch { }
        })();
        return () => { cancelled = true; };
    }, [pdfDoc, pageNum]);

    return (
        <div className={`sp-thumb ${selected ? 'sp-thumb--selected' : ''}`} onClick={onClick}>
            {selected && <div className="sp-thumb-check"><FiCheck size={10} /></div>}
            <div className="sp-thumb-canvas-wrap">
                <canvas ref={canvasRef} className="sp-thumb-canvas" />
            </div>
            <div className="sp-thumb-label">{pageNum}</div>
        </div>
    );
};

/* ─────────────────────────────────────────
   Main
───────────────────────────────────────── */
export default function SplitPdfPage() {
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [fileSize, setFileSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef(null);

    // modes: 'each' | 'range' | 'every'
    const [mode, setMode] = useState('each');
    const [rangeStr, setRangeStr] = useState('');
    const [intervalN, setIntervalN] = useState(2);
    const [selected, setSelected] = useState(new Set());

    const [splitResults, setSplitResults] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBuildingZip, setIsBuildingZip] = useState(false);
    const [done, setDone] = useState(false);

    /* ── Load PDF ── */
    const loadPdf = useCallback(async (f) => {
        if (!f || f.type !== 'application/pdf')
            return alert('Please upload a valid PDF file.');
        setFile(f); setFileSize(f.size);
        setSplitResults([]); setDone(false);
        setSelected(new Set()); setRangeStr('');

        try {
            const pdfjs = await loadPdfJs();
            const ab = await f.arrayBuffer();
            const doc = await pdfjs.getDocument({ data: ab }).promise;
            setPdfDoc(doc); setTotalPages(doc.numPages);
        } catch (e) {
            console.error(e);
            alert('Could not read PDF. Make sure it is not password-protected.');
        }
    }, []);

    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) loadPdf(f);
    };

    /* ── Page selection ── */
    const togglePage = (i) => setSelected(prev => {
        const n = new Set(prev);
        n.has(i) ? n.delete(i) : n.add(i);
        return n;
    });
    const selectAll = () => setSelected(new Set(Array.from({ length: totalPages }, (_, i) => i)));
    const deselectAll = () => setSelected(new Set());

    /* ── Build groups of 0-based page indices ── */
    const buildGroups = useCallback(() => {
        const all = Array.from({ length: totalPages }, (_, i) => i);
        if (mode === 'each') return all.map(i => [i]);
        if (mode === 'every') return chunkArray(all, Math.max(1, intervalN));
        if (mode === 'range') {
            if (rangeStr.trim()) return [parseRanges(rangeStr, totalPages)];
            if (selected.size) return [[...selected].sort((a, b) => a - b)];
            return [];
        }
        return [];
    }, [mode, totalPages, intervalN, rangeStr, selected]);

    /* ── Split ── */
    const doSplit = async () => {
        const groups = buildGroups();
        if (!groups.length) return alert('Select pages or enter a range first.');
        setIsProcessing(true);
        try {
            const ab = await file.arrayBuffer();
            const srcPdf = await PDFDocument.load(ab);
            const results = [];
            for (let gi = 0; gi < groups.length; gi++) {
                const indices = groups[gi];
                if (!indices.length) continue;
                const newDoc = await PDFDocument.create();
                const copied = await newDoc.copyPages(srcPdf, indices);
                copied.forEach(p => newDoc.addPage(p));
                const bytes = await newDoc.save();
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const label = indices.length === 1
                    ? `page_${indices[0] + 1}`
                    : `pages_${indices[0] + 1}-${indices[indices.length - 1] + 1}`;
                results.push({
                    url, bytes,
                    filename: `${file.name.replace(/\.pdf$/i, '')}_${label}.pdf`,
                    pages: indices.map(i => i + 1),
                    size: bytes.length
                });
            }
            setSplitResults(results);
            setDone(true);
        } catch (e) {
            console.error(e);
            alert('Error splitting PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    /* ── Download single file ── */
    const downloadOne = (r) => {
        const a = document.createElement('a');
        a.href = r.url; a.download = r.filename; a.click();
    };

    /* ── Download all as ZIP ── */
    const downloadZip = async () => {
        setIsBuildingZip(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder('split_pdf');
            splitResults.forEach(r => folder.file(r.filename, r.bytes));
            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name.replace(/\.pdf$/i, '')}_split.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        } catch (e) {
            console.error(e);
            alert('Error creating ZIP.');
        } finally {
            setIsBuildingZip(false);
        }
    };

    const reset = () => {
        splitResults.forEach(r => URL.revokeObjectURL(r.url));
        setFile(null); setPdfDoc(null); setTotalPages(0);
        setSplitResults([]); setDone(false);
        setSelected(new Set()); setRangeStr('');
        if (fileRef.current) fileRef.current.value = '';
    };

    /* ── Computed plan info ── */
    const groups = buildGroups();
    const outputCount = groups.length;

    /* ════════════════════ RENDER ════════════════════ */

    /* Upload screen */
    if (!file) return (
        <div
            className={`tp-upload-screen ${isDragging ? 'tp-dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
        >
            <div className="tp-upload-bg" />
            <input ref={fileRef} type="file" accept="application/pdf" className="d-none"
                onChange={e => e.target.files[0] && loadPdf(e.target.files[0])} />
            <div className="tp-upload-inner">
                <div className="sp-upload-icon"><FiScissors size={32} /></div>
                <h1 className="tp-upload-title">Split PDF</h1>
                <p className="tp-upload-desc">
                    Separate a PDF into individual pages or custom ranges.<br />
                    Download each page separately or as a single ZIP archive.<br />
                    <strong>100% local — your file never leaves your browser.</strong>
                </p>
                <button className="tp-select-btn" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                    <FiUploadCloud size={20} /> Select PDF file
                </button>
                <p className="tp-drop-hint mt-3">or drop a PDF here &nbsp;·&nbsp; PDF only</p>
            </div>
        </div>
    );

    /* Done / results screen */
    if (done) return (
        <div className="sp-done-screen">
            <div className="sp-done-card">
                <div className="sp-done-icon"><FiScissors size={26} /></div>
                <h2>Split Complete!</h2>
                <p className="text-muted mb-0">
                    <strong>{splitResults.length}</strong> PDF{splitResults.length !== 1 ? 's' : ''} created from
                    &nbsp;<strong>{file.name}</strong>
                </p>

                {/* ZIP first — most prominent */}
                <button
                    className="sp-zip-btn mt-4"
                    onClick={downloadZip}
                    disabled={isBuildingZip}
                >
                    {isBuildingZip
                        ? <><span className="spinner-border spinner-border-sm me-2" />Building ZIP…</>
                        : <><FiPackage size={18} />&nbsp; Download All as ZIP</>
                    }
                </button>

                <div className="sp-or-divider"><span>or download individually</span></div>

                {/* Individual file list */}
                <div className="sp-result-list">
                    {splitResults.map((r, i) => (
                        <button key={i} className="sp-result-item" onClick={() => downloadOne(r)}>
                            <div className="sp-result-icon"><FiLayers size={13} /></div>
                            <div className="sp-result-info">
                                <div className="sp-result-name">{r.filename}</div>
                                <div className="sp-result-meta">
                                    Page{r.pages.length > 1 ? 's' : ''} {r.pages.join(', ')}
                                    &nbsp;·&nbsp;{fmtBytes(r.size)}
                                </div>
                            </div>
                            <FiDownload size={14} className="sp-result-dl" />
                        </button>
                    ))}
                </div>

                <button className="tp-restart-btn mt-3" onClick={reset}>
                    <FiArrowLeft size={14} /> Split another PDF
                </button>
            </div>
        </div>
    );

    /* Workspace */
    return (
        <div className="tp-workspace sp-workspace">

            {/* LEFT — page thumbnails */}
            <div className="tp-preview-panel">
                <div className="tp-panel-header">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="tp-tool-badge-sm" style={{ background: '#fef2f2', color: '#e53935' }}>
                            <FiScissors size={13} />
                        </div>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.9rem', maxWidth: 240 }} title={file.name}>
                            {file.name.length > 28 ? file.name.slice(0, 26) + '…' : file.name}
                        </span>
                        <span className="tp-file-count">{totalPages} pages · {fmtBytes(fileSize)}</span>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        {mode === 'range' && <>
                            <button className="tp-add-btn" onClick={selectAll}>All</button>
                            <button className="tp-add-btn" onClick={deselectAll}>None</button>
                        </>}
                        <button className="tp-back-btn" onClick={reset}><FiArrowLeft size={13} /> Back</button>
                    </div>
                </div>

                <div className="sp-thumb-area">
                    {!pdfDoc ? (
                        <div className="d-flex align-items-center justify-content-center h-100 gap-2 text-muted" style={{ padding: '3rem 0' }}>
                            <div className="spinner-border spinner-border-sm" /> Rendering pages…
                        </div>
                    ) : (
                        <div className="sp-thumb-grid">
                            {Array.from({ length: totalPages }, (_, i) => {
                                const inPlan = mode === 'each'
                                    ? true
                                    : mode === 'every'
                                        ? true
                                        : rangeStr.trim()
                                            ? parseRanges(rangeStr, totalPages).includes(i)
                                            : selected.has(i);
                                return (
                                    <PageThumb
                                        key={i}
                                        pdfDoc={pdfDoc}
                                        pageNum={i + 1}
                                        selected={inPlan}
                                        onClick={() => mode === 'range' && togglePage(i)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT — controls */}
            <div className="tp-side-panel">
                <div className="tp-side-header">
                    <div className="tp-tool-badge-sm" style={{ background: '#fef2f2', color: '#e53935' }}><FiScissors size={15} /></div>
                    <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Split PDF</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>100% Local · {totalPages} pages</div>
                    </div>
                </div>

                {/* Mode */}
                <div className="tp-settings-block">
                    <div className="tp-settings-label">Split Mode</div>
                    <div className="sp-mode-list">
                        {[
                            { id: 'each', icon: <FiList size={15} />, label: 'Each Page', sub: `Creates ${totalPages} individual PDFs` },
                            { id: 'every', icon: <FiLayers size={15} />, label: 'Every N Pages', sub: 'Split into equal chunks' },
                            { id: 'range', icon: <FiGrid size={15} />, label: 'Custom Range', sub: 'Click pages or type range' },
                        ].map(m => (
                            <button
                                key={m.id}
                                className={`sp-mode-btn ${mode === m.id ? 'active' : ''}`}
                                onClick={() => setMode(m.id)}
                            >
                                <span className="sp-mode-icon">{m.icon}</span>
                                <span className="sp-mode-text">
                                    <span className="sp-mode-label">{m.label}</span>
                                    <span className="sp-mode-sub">{m.sub}</span>
                                </span>
                                {mode === m.id && <FiCheck size={13} className="sp-mode-check" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode options */}
                <div className="tp-settings-block">
                    {mode === 'each' && (
                        <div className="sp-info-box">
                            <FiList size={14} /> Every page becomes its own PDF.<br />
                            <strong>{totalPages} files</strong> will be created — download each or grab all in a ZIP.
                        </div>
                    )}

                    {mode === 'every' && (<>
                        <div className="tp-settings-label">Split every</div>
                        <div className="d-flex align-items-center gap-2">
                            <input
                                className="ie-input"
                                type="number" min="1" max={totalPages}
                                value={intervalN}
                                onChange={e => setIntervalN(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ width: 72 }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>pages</span>
                        </div>
                        <div className="sp-selection-badge mt-2">
                            Creates {Math.ceil(totalPages / Math.max(1, intervalN))} file{Math.ceil(totalPages / Math.max(1, intervalN)) !== 1 ? 's' : ''}
                        </div>
                    </>)}

                    {mode === 'range' && (<>
                        <div className="tp-settings-label">Page Range</div>
                        <input
                            className="ie-input w-100"
                            type="text"
                            placeholder="e.g. 1-3, 5, 7-9"
                            value={rangeStr}
                            onChange={e => setRangeStr(e.target.value)}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 5 }}>
                            Or <strong>click pages</strong> in the panel to select
                        </div>
                        {(rangeStr || selected.size > 0) && (() => {
                            const pages = rangeStr.trim()
                                ? parseRanges(rangeStr, totalPages)
                                : [...selected].sort((a, b) => a - b);
                            return pages.length
                                ? <div className="sp-selection-badge">{pages.length} page{pages.length !== 1 ? 's' : ''} selected</div>
                                : <div className="sp-selection-badge sp-selection-badge--warn">No valid pages</div>;
                        })()}
                    </>)}
                </div>

                {/* Stats */}
                <div className="tp-stats-block">
                    <div className="tp-stat-row"><span>Total pages</span><strong>{totalPages}</strong></div>
                    <div className="tp-stat-row"><span>File size</span><strong>{fmtBytes(fileSize)}</strong></div>
                    <div className="tp-stat-row"><span>Output files</span><strong>{outputCount || '—'}</strong></div>
                </div>

                {/* Actions */}
                <div className="tp-actions">
                    <button className="tp-convert-btn" onClick={doSplit} disabled={isProcessing || !pdfDoc}>
                        {isProcessing
                            ? <><span className="spinner-border spinner-border-sm me-2" />Splitting…</>
                            : <><FiScissors size={15} />&nbsp; Split PDF</>
                        }
                    </button>
                    <button className="tp-reset-btn" onClick={reset} disabled={isProcessing}>
                        <FiTrash2 size={13} /> Start over
                    </button>
                </div>
            </div>
        </div>
    );
}
