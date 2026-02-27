import { Card, Col, Row, Alert, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../context/UsageContext';
import {
  MdMergeType,
  MdContentCut,
  MdCompress,
  MdDescription,
  MdImage,
  MdRotateRight,
  MdLock,
  MdLockOpen,
  MdWater,
  MdViewModule,
  MdTextFields,
  MdArrowForward,
  MdCheckCircle,
  MdCloudUpload,
} from 'react-icons/md';
import './Home.css';

const getColor = (colorClass) => {
  const colors = {
    'color-red': '#e5322d',
    'color-blue': '#3b82f6',
    'color-green': '#10b981',
    'color-purple': '#8b5cf6',
    'color-orange': '#f97316',
    'color-cyan': '#06b6d4',
    'color-pink': '#ec4899',
  };
  return colors[colorClass] || '#e5322d';
};

const tools = [
  { path: '/merge', label: 'Merge PDF', icon: <MdMergeType size={36} />, description: 'Combine multiple PDF files into one single document easily.', color: 'color-red' },
  { path: '/split', label: 'Split PDF', icon: <MdContentCut size={36} />, description: 'Extract pages and split PDF files into smaller documents.', color: 'color-blue' },
  { path: '/compress', label: 'Compress PDF', icon: <MdCompress size={36} />, description: 'Reduce PDF file size while maintaining quality and clarity.', color: 'color-green' },
  { path: '/pdf-to-word', label: 'PDF → Word', icon: <MdDescription size={36} />, description: 'Convert PDF documents to editable Word format easily.', color: 'color-purple' },
  { path: '/pdf-to-jpg', label: 'PDF → JPG', icon: <MdImage size={36} />, description: 'Transform PDF pages into high-quality JPG images instantly.', color: 'color-orange' },
  { path: '/jpg-to-pdf', label: 'JPG → PDF', icon: <MdImage size={36} />, description: 'Convert image files into PDF documents with ease.', color: 'color-cyan' },
  { path: '/rotate', label: 'Rotate PDF', icon: <MdRotateRight size={36} />, description: 'Rotate your PDF pages to the correct orientation quickly.', color: 'color-pink' },
  { path: '/protect', label: 'Protect', icon: <MdLock size={36} />, description: 'Add password protection to secure your PDF files.', color: 'color-red' },
  { path: '/unlock', label: 'Unlock', icon: <MdLockOpen size={36} />, description: 'Remove password protection from encrypted PDF documents.', color: 'color-blue' },
  { path: '/watermark', label: 'Watermark', icon: <MdWater size={36} />, description: 'Add watermarks to protect your PDF intellectual property.', color: 'color-green' },
  { path: '/organize', label: 'Organize', icon: <MdViewModule size={36} />, description: 'Rearrange, delete, and organize PDF pages effortlessly.', color: 'color-purple' },
  { path: '/ocr', label: 'OCR', icon: <MdTextFields size={36} />, description: 'Extract text from scanned PDFs using advanced OCR.', color: 'color-orange' },
];

const featuredTools = [
  tools[0], // Merge
  tools[1], // Split
  tools[2], // Compress
];

export default function Home() {
  const { user } = useAuth();
  const { isLimitExceeded } = useUsage();


  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      {/* <section className="hero-section">
        <Container>
          <Row className="align-items-center py-5">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="hero-title mb-3">
                All the PDF tools you need, in one place
              </h1>
              <p className="hero-subtitle mb-4">
                Merge, split, compress, convert, and more. Free to use, no sign-up required.
              </p>
              <div className="hero-benefits mb-4">
                <div className="benefit-item">
                  <MdCheckCircle className="benefit-icon" />
                  <span>No installation needed</span>
                </div>
                <div className="benefit-item">
                  <MdCheckCircle className="benefit-icon" />
                  <span>Files deleted after processing</span>
                </div>
                <div className="benefit-item">
                  <MdCheckCircle className="benefit-icon" />
                  <span>Secure & Fast</span>
                </div>
              </div>
              {!user && (
                <Button
                  as={Link}
                  to="/login"
                  className="btn-hero-cta"
                >
                  Try Premium Now <MdArrowForward />
                </Button>
              )}
            </Col>
            <Col lg={6} className="text-center">
              <div className="hero-visual">
                <MdCloudUpload size={100} className="hero-icon" />
              </div>
            </Col>
          </Row>
        </Container>
      </section> */}

      {/* Usage Alert */}
      {(!user && isLimitExceeded) && (
        <Container>
          <Alert variant="warning" className="alert-custom">
            <strong>🚀 You've used 5 free tools!</strong> <Link to="/login">Login now</Link> to unlock unlimited access.
          </Alert>
        </Container>
      )}

      {/* Featured Tools Section */}
      {!isLimitExceeded && (
        <section className="featured-section mb-0">
          <Container>
            <div className="section-header">
              <h2>Everything you need to work with PDFs, all in one place.</h2>
              <p>Merge, split, compress, convert, and more. Free to use, no sign-up required.</p>
            </div>
            {/* <Row xs={1} md={3} className="g-2">
              {featuredTools.map((t) => (
                <Col key={t.path}>
                  <Card as={Link} to={t.path} className="tool-card featured">
                    <Card.Body>
                      <div className="tool-icon-wrapper">{t.icon}</div>
                      <Card.Title className="tool-title">{t.label}</Card.Title>
                      <span className="tool-arrow">
                        <MdArrowForward />
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row> */}
          </Container>
        </section>
      )}

      {/* All Tools Section */}
      <section className="all-tools-section pt-2">
        <Container>
          {/* <div className="section-header">
            <h2>All Tools</h2>
            <p>Complete suite of PDF utilities</p>
          </div> */}
          <Row className="g-4">
            {tools.map((t) => (
              <Col key={t.path} xs={6} md={4} lg={3}>
                <Card as={Link} to={t.path} className={`tool-card ${t.color}`}>
                  <Card.Body className="tool-card-body">
                    <div className="tool-icon-wrapper" style={{ color: getColor(t.color) }}>
                      {t.icon}
                    </div>
                    <Card.Title className="tool-title">{t.label}</Card.Title>
                    <p className="tool-description">{t.description}</p>
                    <div className="tool-action-button">
                      <span>Get Started</span>
                      <MdArrowForward />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <Container>
            <div className="cta-content">
              <h2>Ready for unlimited power?</h2>
              <p>Sign up to get unlimited PDF processing with no restrictions.</p>
              <Button as={Link} to="/login" className="btn-cta-primary">
                Get Started Free
              </Button>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

