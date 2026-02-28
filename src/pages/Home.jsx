import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { toolGroups, highlightTools } from '../data/toolsData';
import { useAuth } from '../context/AuthContext';

/* Reorder groups: Convert to PDF → Convert from PDF → rest */
const orderedGroups = [
    ...toolGroups.filter(g => g.id === 'convert-to-pdf'),
    ...toolGroups.filter(g => g.id === 'convert-from-pdf'),
    ...toolGroups.filter(g => !['convert-to-pdf', 'convert-from-pdf'].includes(g.id)),
];

const Home = () => {
    const navigate = useNavigate();
    const { trackUsage } = useAuth();
    const toolsRef = useRef(null);

    const handleToolSelect = (toolPath) => {
        if (trackUsage()) navigate(toolPath);
    };

    const scrollToTools = () => {
        toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            {/* ── Hero ── */}
            <section className="hero-section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <h1 className="hero-title">
                                Every tool you need to work with <br />
                                <span>PDFs in one place</span>
                            </h1>
                            <p className="hero-subtitle mb-lg-3" style={{ textWrap: 'balance' }}>
                                100% FREE &amp; easy to use — merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
                            </p>
                            <button
                                className="cta-btn mt-lg-3 border-0 d-inline-flex align-items-center gap-2"
                                onClick={scrollToTools}
                                style={{ background: 'linear-gradient(135deg,#e53935,#ff6f61)', color: '#fff', fontSize: '1.15rem', padding: '0.9rem 2.75rem', borderRadius: '50px' }}
                            >
                                Explore Tools <FiArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Marquee ── */}
            <section className="marquee-container">
                <div className="marquee-content px-4">
                    {[...highlightTools, ...highlightTools].map((tool, idx) => {
                        const Icon = tool.icon;
                        return (
                            <div key={idx} className="highlight-tool-card" onClick={() => handleToolSelect(tool.path)}>
                                <div className="ht-icon" style={{ backgroundColor: tool.bgColor, color: tool.color }}>
                                    <Icon />
                                </div>
                                <div className="ht-text">
                                    <div className="ht-title">{tool.name}</div>
                                    <div className="ht-desc">{tool.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Tools by Group ── */}
            <section className="tools-section" ref={toolsRef}>
                {orderedGroups.map((group) => (
                    <div key={group.id} className="tool-group-block">
                        {/* Group header */}
                        <div className="tg-header">
                            <h2 className="tg-title">{group.title}</h2>
                            <div className="tg-line" />
                        </div>

                        {/* Tools grid */}
                        <div className="tools-grid">
                            {group.items.map((tool) => {
                                const Icon = tool.icon;
                                return (
                                    <div key={tool.id} className="tool-box" onClick={() => handleToolSelect(tool.path)}>
                                        <div className="tb-icon-wrapper" style={{ backgroundColor: tool.bgColor, color: tool.color }}>
                                            <Icon />
                                        </div>
                                        <h3 className="tb-title">{tool.name}</h3>
                                        <p className="tb-desc">{tool.description}</p>
                                        <div className="tb-action">
                                            Use Tool <FiArrowRight size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Features ── */}
            <section className="feature-section">
                <h2 className="section-title mb-3">Why choose iLovePDF.in?</h2>
                <p className="text-muted fs-5 mb-5 max-w-700 mx-auto">
                    We bring you the absolute best in web-based PDF utility applications, built for speed and simplicity.
                </p>
                <div className="feature-grid">
                    <div>
                        <div className="f-icon"><FiCheckCircle /></div>
                        <h4 className="fw-bold fs-5 mb-3">Top Quality</h4>
                        <p className="text-muted">We use the best tools to process your files, providing peak quality processing.</p>
                    </div>
                    <div>
                        <div className="f-icon"><FiCheckCircle /></div>
                        <h4 className="fw-bold fs-5 mb-3">Secure Connection</h4>
                        <p className="text-muted">All files are processed securely and deleted from our servers instantly to protect your privacy.</p>
                    </div>
                    <div>
                        <div className="f-icon"><FiCheckCircle /></div>
                        <h4 className="fw-bold fs-5 mb-3">Anywhere, Anytime</h4>
                        <p className="text-muted">Use our web application from any browser on any device, Mac, Windows, Linux, iOS or Android.</p>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="testimonial-section bg-white py-5 border-top">
                <div className="container my-5">
                    <h2 className="section-title mb-5">Trusted by millions</h2>
                    <div className="row g-4 justify-content-center">
                        {[
                            { text: '"The fastest PDF converter I\'ve ever used. The UI is so clean and premium, and the compress tool works like magic without losing quality."', name: '— Sarah J., Designer' },
                            { text: '"I appreciate that there\'s no learning curve. You just drop the file and it\'s done. Highly recommended for any document workflow."', name: '— Michael D., Accountant' },
                            { text: '"I use the merge and split features every day. Having all these PDF tools available online for free has been a huge time saver for me."', name: '— Linda P., Educator' },
                        ].map((t, i) => (
                            <div key={i} className="col-md-4">
                                <div className="p-4 bg-light rounded-4 h-100">
                                    <div className="d-flex text-warning mb-3">{'★'.repeat(5)}</div>
                                    <p className="fst-italic text-muted mb-4">{t.text}</p>
                                    <div className="fw-bold">{t.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-section">
                <h2 className="cta-title">Ready to optimize your documents?</h2>
                <p className="fs-5 opacity-75">Join millions of users who are using iLovePDF.in everyday to save time.</p>
                <button className="cta-btn" onClick={scrollToTools}>Start for free</button>
            </section>
        </>
    );
};

export default Home;
