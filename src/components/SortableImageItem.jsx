import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiX, FiMove, FiFileText } from 'react-icons/fi';
import mammoth from 'mammoth';

/* ─── live page-preview thumbnail for jpg-to-pdf ─── */
const PagePreview = ({ src, jpgConfig }) => {
    const isLandscape = jpgConfig?.orientation === 'landscape';
    const margin = jpgConfig?.margin || 'small';

    // Thumbnail canvas: always fits in the card
    // Portrait  → 100 × 134  (≈ A4 ratio 1:1.41)
    // Landscape → 134 × 100
    const W = isLandscape ? 134 : 100;
    const H = isLandscape ? 100 : 134;

    const gapPx = margin === 'no' ? 0 : margin === 'small' ? 6 : 14;

    return (
        <div style={{
            width: W,
            height: H,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
            padding: gapPx,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }}>
            <img
                src={src}
                alt="preview"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 3,
                    display: 'block',
                    transition: 'all 0.2s',
                }}
            />
        </div>
    );
};

export const SortableImageItem = ({ image, onRemove, jpgConfig }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    const isWord = image.file.name.toLowerCase().endsWith('.docx');
    const [wordPreview, setWordPreview] = useState('');

    useEffect(() => {
        if (isWord && image.file) {
            const extractHtml = async () => {
                try {
                    const arrayBuffer = await image.file.arrayBuffer();
                    const { value } = await mammoth.convertToHtml({ arrayBuffer });
                    setWordPreview(value);
                } catch (err) {
                    console.error('Word preview generation failed:', err);
                }
            };
            extractHtml();
        }
    }, [isWord, image.file]);

    return (
        <div ref={setNodeRef} style={style} className="tp-thumb-card">

            {/* Drag handle */}
            <div
                className="tp-thumb-drag"
                {...attributes}
                {...listeners}
                title="Drag to reorder"
            >
                <FiMove size={13} />
            </div>

            {/* Remove btn */}
            <button
                className="tp-thumb-remove"
                onClick={e => { e.stopPropagation(); onRemove(image.id); }}
                title="Remove"
            >
                <FiX size={13} />
            </button>

            {/* Preview area */}
            <div className="tp-thumb-preview">
                {isWord ? (
                    <div className="tp-thumb-word-wrap">
                        {wordPreview ? (
                            <>
                                <div
                                    className="tp-thumb-word-content"
                                    dangerouslySetInnerHTML={{ __html: wordPreview }}
                                />
                                <div className="tp-thumb-word-fade" />
                            </>
                        ) : (
                            <div className="d-flex flex-column align-items-center gap-1">
                                <div className="spinner-border spinner-border-sm text-primary" />
                                <span style={{ fontSize: 10 }} className="text-muted fw-bold text-uppercase">Loading…</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Live page preview — shows margin + orientation */
                    <PagePreview src={image.preview} jpgConfig={jpgConfig} />
                )}
            </div>

            {/* Filename */}
            <div className="tp-thumb-name">{image.file.name}</div>
        </div>
    );
};
