import {
    FiFileText, FiImage, FiUnlock, FiLock, FiScissors, FiLayers,
    FiEdit, FiFilePlus, FiRepeat, FiRotateCw, FiHash, FiDroplet,
    FiCrop, FiEyeOff, FiGitMerge, FiCamera, FiGlobe, FiShield,
    FiPenTool, FiAlertOctagon
} from 'react-icons/fi';
import { BsFileEarmarkWord, BsFileEarmarkSpreadsheet, BsFileEarmarkSlides } from 'react-icons/bs';

export const toolGroups = [
    {
        title: 'Organize PDF',
        id: 'organize-pdf',
        items: [
            { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine PDFs in the order you want.', icon: FiLayers, color: '#E91E63', bgColor: '#fce4ec', path: '/tool/merge-pdf' },
            { id: 'split-pdf', name: 'Split PDF', description: 'Separate pages into independent PDF files.', icon: FiScissors, color: '#9C27B0', bgColor: '#f3e5f5', path: '/tool/split-pdf' },
            { id: 'remove-pages', name: 'Remove Pages', description: 'Remove pages from a PDF in a flash.', icon: FiFileText, color: '#F44336', bgColor: '#ffebee', path: '/tool/remove-pages' },
            { id: 'extract-pages', name: 'Extract Pages', description: 'Get a new document from desired pages.', icon: FiFilePlus, color: '#00BCD4', bgColor: '#e0f7fa', path: '/tool/extract-pages' },
            { id: 'organize-pdf', name: 'Organize PDF', description: 'Sort, reorder and manage pages easily.', icon: FiGitMerge, color: '#FF9800', bgColor: '#fff3e0', path: '/tool/organize-pdf' },
            { id: 'scan-to-pdf', name: 'Scan to PDF', description: 'Convert scanned images into a searchable PDF.', icon: FiCamera, color: '#795548', bgColor: '#efebe9', path: '/tool/scan-to-pdf' },
        ]
    },
    {
        title: 'Optimize PDF',
        id: 'optimize-pdf',
        items: [
            { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce file size while optimizing quality.', icon: FiRepeat, color: '#607D8B', bgColor: '#eceff1', path: '/tool/compress-pdf' },
            { id: 'repair-pdf', name: 'Repair PDF', description: 'Repair and recover content from a damaged PDF.', icon: FiAlertOctagon, color: '#FF5722', bgColor: '#fbe9e7', path: '/tool/repair-pdf' },
            { id: 'ocr-pdf', name: 'OCR PDF', description: 'Make scanned PDFs searchable and selectable.', icon: FiEyeOff, color: '#009688', bgColor: '#e0f2f1', path: '/tool/ocr-pdf' },
        ]
    },
    {
        title: 'Convert to PDF',
        id: 'convert-to-pdf',
        items: [
            { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPG images to PDF easily.', icon: FiImage, color: '#F4B400', bgColor: '#fef7e0', path: '/tool/jpg-to-pdf' },
            { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert DOC and DOCX files to PDF.', icon: BsFileEarmarkWord, color: '#1A73E8', bgColor: '#e8f0fe', path: '/tool/word-to-pdf' },
            { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', description: 'Convert PPT and PPTX to viewable PDFs.', icon: BsFileEarmarkSlides, color: '#FF7043', bgColor: '#fbe9e7', path: '/tool/powerpoint-to-pdf' },
            { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert EXCEL spreadsheets to PDF.', icon: BsFileEarmarkSpreadsheet, color: '#0F9D58', bgColor: '#e6f4ea', path: '/tool/excel-to-pdf' },
            { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert HTML web pages to PDF.', icon: FiGlobe, color: '#00BCD4', bgColor: '#e0f7fa', path: '/tool/html-to-pdf' },
        ]
    },
    {
        title: 'Convert from PDF',
        id: 'convert-from-pdf',
        items: [
            { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages into JPG images.', icon: FiImage, color: '#F4B400', bgColor: '#fef7e0', path: '/tool/pdf-to-jpg' },
            { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF files to editable DOC/DOCX.', icon: BsFileEarmarkWord, color: '#1A73E8', bgColor: '#e8f0fe', path: '/tool/pdf-to-word' },
            { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', description: 'Turn PDFs into easy to edit slideshows.', icon: BsFileEarmarkSlides, color: '#FF7043', bgColor: '#fbe9e7', path: '/tool/pdf-to-powerpoint' },
            { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Pull PDF data into EXCEL spreadsheets.', icon: BsFileEarmarkSpreadsheet, color: '#0F9D58', bgColor: '#e6f4ea', path: '/tool/pdf-to-excel' },
        ]
    },
    {
        title: 'Edit PDF',
        id: 'edit-pdf',
        items: [
            { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate your pages to the correct orientation.', icon: FiRotateCw, color: '#3F51B5', bgColor: '#e8eaf6', path: '/tool/rotate-pdf' },
            { id: 'add-page-numbers', name: 'Add Page Numbers', description: 'Add page numbers to your PDF.', icon: FiHash, color: '#009688', bgColor: '#e0f2f1', path: '/tool/add-page-numbers' },
            { id: 'add-watermark', name: 'Add Watermark', description: 'Stamp an image or text over your PDF.', icon: FiDroplet, color: '#2196F3', bgColor: '#e3f2fd', path: '/tool/add-watermark' },
            { id: 'crop-pdf', name: 'Crop PDF', description: 'Crop pages to your preferred size.', icon: FiCrop, color: '#FF9800', bgColor: '#fff3e0', path: '/tool/crop-pdf' },
            { id: 'edit-pdf', name: 'Edit PDF', description: 'Add text, shapes and freehand drawings to PDF.', icon: FiEdit, color: '#E91E63', bgColor: '#fce4ec', path: '/tool/edit-pdf' },
        ]
    },
    {
        title: 'PDF Security',
        id: 'pdf-security',
        items: [
            { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove PDF password protection.', icon: FiUnlock, color: '#4CAF50', bgColor: '#e8f5e9', path: '/tool/unlock-pdf' },
            { id: 'protect-pdf', name: 'Protect PDF', description: 'Encrypt your PDF with a password.', icon: FiLock, color: '#3F51B5', bgColor: '#e8eaf6', path: '/tool/protect-pdf' },
            { id: 'sign-pdf', name: 'Sign PDF', description: 'Sign yourself or request signatures from others.', icon: FiPenTool, color: '#9C27B0', bgColor: '#f3e5f5', path: '/tool/sign-pdf' },
            { id: 'redact-pdf', name: 'Redact PDF', description: 'Permanently remove sensitive content from your PDF.', icon: FiEyeOff, color: '#F44336', bgColor: '#ffebee', path: '/tool/redact-pdf' },
            { id: 'compare-pdf', name: 'Compare PDF', description: 'Show a side-by-side document comparison.', icon: FiShield, color: '#607D8B', bgColor: '#eceff1', path: '/tool/compare-pdf' },
        ]
    },
];

export const allTools = toolGroups.flatMap(group => group.items);
export const highlightTools = [
    allTools.find(t => t.id === 'jpg-to-pdf'),
    allTools.find(t => t.id === 'merge-pdf'),
    allTools.find(t => t.id === 'compress-pdf'),
    allTools.find(t => t.id === 'split-pdf'),
    allTools.find(t => t.id === 'pdf-to-word'),
].filter(Boolean);
