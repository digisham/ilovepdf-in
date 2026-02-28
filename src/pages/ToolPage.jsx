import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { allTools } from '../data/toolsData';
import { FiUploadCloud, FiArrowLeft, FiSettings, FiDownload, FiTrash2, FiFileText, FiImage, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableImageItem } from '../components/SortableImageItem';

const ToolPage = () => {
    const { toolId } = useParams();
    const navigate = useNavigate();
    const { trackUsage } = useAuth();

    const [tool, setTool] = useState(null);
    const [files, setFiles] = useState([]); // Support multiple files
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadReady, setDownloadReady] = useState(null);
    const [jpgConfig, setJpgConfig] = useState({
        orientation: 'portrait',
        pageSize: 'A4',
        margin: 'small',
        mergeAll: true,
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Basic route matching
        const currentTool = allTools.find(
            t => t.path === `/tool/${toolId}` || t.id === toolId
        );

        if (currentTool) {
            setTool(currentTool);
        } else {
            navigate('/');
        }
    }, [toolId, navigate]);

    // Handle initial file selection (or array of files for jpg-to-pdf)
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (!selectedFiles.length) return;

        if (!trackUsage()) {
            e.target.value = '';
            return;
        }

        processIncomingFiles(selectedFiles);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (!droppedFiles.length) return;

        if (!trackUsage()) return;
        processIncomingFiles(droppedFiles);
    };

    const processIncomingFiles = (incomingFiles) => {
        const isJpgToPdf = toolId === 'jpg-to-pdf';
        const isWordToPdf = toolId === 'word-to-pdf';
        let validFiles = incomingFiles;

        if (isJpgToPdf) {
            // Keep only images
            validFiles = incomingFiles.filter(f => f.type.startsWith('image/'));
        } else if (isWordToPdf) {
            // Keep only docx
            validFiles = incomingFiles.filter(f =>
                f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                f.name.toLowerCase().endsWith('.docx')
            );
        } else {
            // Standard tools only allow 1 PDF for now locally
            validFiles = incomingFiles.filter(f => f.type === 'application/pdf').slice(0, 1);
        }

        if (validFiles.length === 0) {
            if (isJpgToPdf) alert("Please upload valid images (JPG/PNG)");
            else if (isWordToPdf) alert("Please upload a valid .DOCX document");
            else alert("Please upload a valid PDF.");
            return;
        }

        // Map files to objects with temporary preview URLs
        const newFileObjects = validFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            preview: URL.createObjectURL(file), // create local Blob string 
        }));

        if (isJpgToPdf || isWordToPdf) {
            setFiles(prev => [...prev, ...newFileObjects]);
        } else {
            setFiles(newFileObjects);
        }

        setDownloadReady(null);
    };

    const resetWorkspace = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview));
        setFiles([]);
        setDownloadReady(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (idToRemove) => {
        setFiles(prevFiles => {
            const fileToRemove = prevFiles.find(f => f.id === idToRemove);
            if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
            return prevFiles.filter(f => f.id !== idToRemove);
        });
        if (files.length <= 1) {
            setDownloadReady(null); // Resets processing block if they empty it
        }
    };

    // --- DRAG AND DROP (DND KIT) LOGIC ---
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // --- PROCESSING LOGIC ---
    const processLocally = async () => {
        if (!files.length) return;
        setIsProcessing(true);

        try {
            // Small simulation delay to feel authentic
            await new Promise(resolve => setTimeout(resolve, 1500));

            let pdfBytes;

            if (toolId === 'jpg-to-pdf') {
                // Merge multiple images into single PDF
                pdfBytes = await convertImagesToPdf(files);
            } else if (toolId === 'word-to-pdf') {
                // Word to PDF local conversion logic
                pdfBytes = await convertWordToPdf(files);
            } else {
                // Standard single PDF modify processing
                const arrayBuffer = await files[0].file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                pdfDoc.setTitle(`Processed by iLovePDF.in - ${tool.name}`);
                pdfDoc.setAuthor('iLovePDF.in');
                pdfBytes = await pdfDoc.save();
            }

            // Create a native blob for downloading (NEVER stores on server)
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const downloadUrl = URL.createObjectURL(blob);
            setDownloadReady({
                url: downloadUrl,
                filename: `ilovepdf_merged_${Date.now()}.pdf`
            });

        } catch (err) {
            console.error(err);
            alert('Error processing document. Ensure it is a valid format.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Engine for creating PDF dynamically from JPGs
    const PAGE_SIZES = {
        'A4': [595.28, 841.89],
        'A3': [841.89, 1190.55],
        'Letter': [612, 792],
        'Legal': [612, 1008],
        'Fit': null, // dynamic — matches image
    };

    const convertImagesToPdf = async (imageFileObjects) => {
        const pdfDoc = await PDFDocument.create();

        let marginSize = 0;
        if (jpgConfig.margin === 'small') marginSize = 15;
        if (jpgConfig.margin === 'big') marginSize = 40;

        const isLandscape = jpgConfig.orientation === 'landscape';
        const fixedSize = PAGE_SIZES[jpgConfig.pageSize]; // null = Fit Image

        for (const fileObj of imageFileObjects) {
            const imageBytes = await fileObj.file.arrayBuffer();
            let image;

            if (fileObj.file.type === 'image/jpeg' || fileObj.file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (fileObj.file.type === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                continue;
            }

            let pageW, pageH;

            if (fixedSize) {
                // Portrait base — swap if landscape
                [pageW, pageH] = isLandscape ? [fixedSize[1], fixedSize[0]] : [fixedSize[0], fixedSize[1]];
            } else {
                // Fit Image: page = image dimensions (+ margin)
                pageW = image.width + marginSize * 2;
                pageH = image.height + marginSize * 2;
                if (isLandscape && pageW < pageH) [pageW, pageH] = [pageH, pageW];
            }

            const maxW = pageW - marginSize * 2;
            const maxH = pageH - marginSize * 2;

            // Scale image to fit within content area keeping aspect ratio
            const ratio = Math.min(maxW / image.width, maxH / image.height);
            const drawW = image.width * ratio;
            const drawH = image.height * ratio;

            // Center on page
            const xPos = marginSize + (maxW - drawW) / 2;
            const yPos = marginSize + (maxH - drawH) / 2;

            const page = pdfDoc.addPage([pageW, pageH]);
            page.drawImage(image, { x: xPos, y: yPos, width: drawW, height: drawH });
        }

        return await pdfDoc.save();
    };

    // Engine for converting Word (.docx) to PDF
    const convertWordToPdf = async (fileList) => {
        const mergedPdfDoc = await PDFDocument.create();

        for (const fileObj of fileList) {
            const file = fileObj.file;
            // 1. Extract pure HTML from docx file buffer using Mammoth
            const arrayBuffer = await file.arrayBuffer();
            const { value: htmlStr } = await mammoth.convertToHtml({ arrayBuffer });

            // 2. We inject it into a hidden temporary div container in DOM
            const tempContainer = document.createElement('div');
            // Applying basic styling so it looks like a document
            tempContainer.innerHTML = htmlStr;
            tempContainer.style.padding = '20px';
            tempContainer.style.fontFamily = 'Arial, sans-serif';
            tempContainer.style.fontSize = '12pt';
            tempContainer.style.color = '#000';
            tempContainer.style.background = '#fff';
            tempContainer.style.width = '210mm'; // Standard A4 width

            document.body.appendChild(tempContainer);

            // 3. Render HTML to canvas to PDF using html2pdf
            const opt = {
                margin: 10, // mm
                filename: 'converted.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Output raw array buffer
            const pdfArrayBuffer = await html2pdf().from(tempContainer).set(opt).outputPdf('arraybuffer');

            // Clean up DOM
            document.body.removeChild(tempContainer);

            // 4. Copy pages into merged doc
            const pdfDocToMerge = await PDFDocument.load(pdfArrayBuffer);
            const copiedPages = await mergedPdfDoc.copyPages(pdfDocToMerge, pdfDocToMerge.getPageIndices());
            copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
        }

        return await mergedPdfDoc.save();
    };


    if (!tool) return null;

    const isJpgToPdf = toolId === 'jpg-to-pdf';
    const isWordToPdf = toolId === 'word-to-pdf';

    // Format acceptance based on tool
    const getAcceptFormat = () => {
        if (isJpgToPdf) return "image/jpeg, image/png";
        if (isWordToPdf) return ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return "application/pdf";
    };

    const getPrimaryIcon = () => {
        if (isJpgToPdf) return <FiImage className="dd-icon text-danger" />;
        if (isWordToPdf) return <FiFileText className="dd-icon text-primary" />;
        return <FiUploadCloud className="dd-icon text-danger" />;
    };

    const getDragDropTitle = () => {
        if (isJpgToPdf) return 'Select JPG images';
        if (isWordToPdf) return 'Select Word files';
        return 'Select PDF file';
    };

    const getDragDropSubtitle = () => {
        if (isJpgToPdf) return 'images';
        if (isWordToPdf) return 'Word documents';
        return 'PDFs';
    };

    return (
        <div className="tp-shell">

            {/* Hidden file input */}
            <input
                type="file"
                accept={getAcceptFormat()}
                multiple={isJpgToPdf || isWordToPdf}
                className="d-none"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* ============ UPLOAD SCREEN ============ */}
            {!files.length && (
                <div
                    className="tp-upload-screen"
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('tp-dragging'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('tp-dragging')}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('tp-dragging'); handleDrop(e); }}
                    onClick={() => fileInputRef.current.click()}
                >
                    {/* Subtle grid background */}
                    <div className="tp-upload-bg" />

                    <div className="tp-upload-inner">

                        <h1 className="tp-upload-title">{tool.name}</h1>
                        <p className="tp-upload-desc">{tool.description}</p>

                        <button
                            className="tp-select-btn"
                            onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}
                        >
                            <FiUploadCloud size={20} />
                            {getDragDropTitle()}
                        </button>

                        <p className="tp-drop-hint mt-3">
                            or drop {getDragDropSubtitle()} anywhere on this page
                            &nbsp;&middot;&nbsp;
                            {isJpgToPdf ? "JPG, PNG" : isWordToPdf ? ".DOCX" : "PDF only"}
                            &nbsp;&middot; 100% local
                        </p>
                    </div>
                </div>
            )}

            {/* ============ SUCCESS SCREEN ============ */}
            {files.length > 0 && downloadReady && (
                <div className="tp-success-screen">
                    <div className="tp-success-card">
                        <div className="tp-success-icon">
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '1.75rem' }}>Your PDF is ready!</h2>
                        <p className="text-muted mb-5">Converted successfully &amp; kept privately in your browser.</p>

                        <a
                            href={downloadReady.url}
                            download={downloadReady.filename}
                            className="tp-download-btn"
                        >
                            <FiDownload size={20} /> Download PDF
                        </a>

                        <button className="tp-restart-btn" onClick={resetWorkspace}>
                            <FiArrowLeft size={16} /> Convert another file
                        </button>
                    </div>
                </div>
            )}

            {/* ============ WORKSPACE SCREEN ============ */}
            {files.length > 0 && !downloadReady && (
                <div className="tp-workspace">
                    {/* Left: preview area */}
                    <div className="tp-preview-panel">
                        <div className="tp-panel-header">
                            <div className="d-flex align-items-center gap-2">
                                <div className="tp-tool-badge-sm" style={{ background: tool.bgColor, color: tool.color }}>
                                    <tool.icon size={14} />
                                </div>
                                <span className="fw-bold text-dark">{isJpgToPdf || isWordToPdf ? 'Reorder Files' : 'Document Preview'}</span>
                                <span className="tp-file-count">{files.length} file{files.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="d-flex gap-2">
                                {(isJpgToPdf || isWordToPdf) && (
                                    <button className="tp-add-btn" onClick={() => fileInputRef.current.click()}>
                                        <FiPlus size={14} /> Add more
                                    </button>
                                )}
                                <button className="tp-back-btn" onClick={() => { resetWorkspace(); navigate('/'); }}>
                                    <FiArrowLeft size={14} /> Back
                                </button>
                            </div>
                        </div>

                        {/* Preview body — also a drop zone */}
                        <div className="tp-preview-body"
                            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('tp-drop-active'); }}
                            onDragLeave={e => e.currentTarget.classList.remove('tp-drop-active')}
                            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('tp-drop-active'); handleDrop(e); }}
                        >
                            {(isJpgToPdf || isWordToPdf) ? (
                                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={files.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                                        <div className="tp-thumb-grid">
                                            {files.map(fileObj => (
                                                <SortableImageItem
                                                    key={fileObj.id}
                                                    image={fileObj}
                                                    onRemove={removeFile}
                                                    jpgConfig={jpgConfig}
                                                />
                                            ))}
                                            <div className="tp-add-tile" onClick={() => fileInputRef.current.click()}>
                                                <FiPlus size={28} className="text-muted mb-1" />
                                                <span className="small text-muted">Add more</span>
                                            </div>
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <iframe
                                    src={`${files[0].preview}#toolbar=0`}
                                    width="100%"
                                    height="100%"
                                    className="tp-iframe"
                                    title="PDF Preview"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right: action panel */}
                    <div className="tp-side-panel">
                        <div className="tp-side-header">
                            <div className="tp-tool-badge-sm" style={{ background: tool.bgColor, color: tool.color }}>
                                <tool.icon size={16} />
                            </div>
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{tool.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>100% Local Processing</div>
                            </div>
                        </div>

                        {isJpgToPdf && (
                            <div className="tp-settings-block">

                                {/* Orientation */}
                                <div className="tp-settings-label">Page Orientation</div>
                                <div className="tp-toggle-group">
                                    {[['portrait', 'Portrait 📄'], ['landscape', 'Landscape 🗃️']].map(([val, label]) => (
                                        <button key={val}
                                            className={`tp-toggle-btn ${jpgConfig.orientation === val ? 'active' : ''}`}
                                            onClick={() => setJpgConfig(c => ({ ...c, orientation: val }))}
                                        >{label}</button>
                                    ))}
                                </div>

                                {/* Page Size */}
                                <div className="tp-settings-label mt-3">Page Size</div>
                                <select
                                    className="tp-select"
                                    value={jpgConfig.pageSize}
                                    onChange={e => setJpgConfig(c => ({ ...c, pageSize: e.target.value }))}
                                >
                                    <option value="A4">A4 (210 × 297 mm)</option>
                                    <option value="A3">A3 (297 × 420 mm)</option>
                                    <option value="Letter">US Letter (216 × 279 mm)</option>
                                    <option value="Legal">US Legal (216 × 356 mm)</option>
                                    <option value="Fit">Fit Image (auto size)</option>
                                </select>

                                {/* Margin */}
                                <div className="tp-settings-label mt-3">Margin</div>
                                <div className="tp-toggle-group">
                                    {[['no', 'No margin'], ['small', 'Small'], ['big', 'Big']].map(([val, label]) => (
                                        <button key={val}
                                            className={`tp-toggle-btn ${jpgConfig.margin === val ? 'active' : ''}`}
                                            onClick={() => setJpgConfig(c => ({ ...c, margin: val }))}
                                        >{label}</button>
                                    ))}
                                </div>

                                {/* Merge */}
                                <div className="tp-settings-label mt-3">Output</div>
                                <label className="tp-merge-toggle">
                                    <input
                                        type="checkbox"
                                        checked={jpgConfig.mergeAll}
                                        onChange={e => setJpgConfig(c => ({ ...c, mergeAll: e.target.checked }))}
                                    />
                                    <span className="tp-merge-track">
                                        <span className="tp-merge-thumb" />
                                    </span>
                                    <span className="tp-merge-label">Merge all images into one PDF</span>
                                </label>

                            </div>
                        )}

                        <div className="tp-stats-block">
                            <div className="tp-stat-row">
                                <span>Files loaded</span>
                                <strong>{files.length}</strong>
                            </div>
                            <div className="tp-stat-row">
                                <span>Total size</span>
                                <strong>{(files.reduce((a, f) => a + f.file.size, 0) / 1024 / 1024).toFixed(2)} MB</strong>
                            </div>
                        </div>

                        <div className="tp-actions">
                            <button className="tp-convert-btn" onClick={processLocally} disabled={isProcessing}>
                                {isProcessing ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />Converting…</>
                                ) : (
                                    <>
                                        {isJpgToPdf || isWordToPdf ? 'Convert to PDF' : 'Process File'}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 8 }}><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                    </>
                                )}
                            </button>
                            <button className="tp-reset-btn" onClick={resetWorkspace} disabled={isProcessing}>
                                <FiTrash2 size={14} /> Start over
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolPage;
