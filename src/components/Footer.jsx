import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiLinkedin, FiInstagram } from 'react-icons/fi';
import { toolGroups } from '../data/toolsData';

const Footer = () => {
    return (
        <footer className="premium-footer">
            <div className="footer-grid">
                <div className="footer-col-brand">
                    <Link to="/" className="d-flex align-items-center gap-2 mb-3">
                        <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 12 }}>PDF</div>
                        <span className="fw-bold text-white fs-5">iLovePDF<span className="text-danger">.in</span></span>
                    </Link>
                    <p className="mb-4" style={{ color: '#9ca3af', lineHeight: 1.6 }}>
                        Premium online tools to manage, convert, and optimize PDFs seamlessly.
                        A sleek, secure, and professional frontend UI for every document.
                    </p>
                    <div className="d-flex gap-3">
                        <a href="#" className="text-muted"><FiTwitter size={20} /></a>
                        <a href="#" className="text-muted"><FiFacebook size={20} /></a>
                        <a href="#" className="text-muted"><FiLinkedin size={20} /></a>
                        <a href="#" className="text-muted"><FiInstagram size={20} /></a>
                    </div>
                </div>

                {toolGroups.slice(0, 3).map((group) => (
                    <div key={group.title} className="footer-col">
                        <h4 className="footer-title">{group.title}</h4>
                        <ul className="footer-links">
                            {group.items.slice(0, 5).map(tool => (
                                <li key={tool.id}><Link to={tool.path}>{tool.name}</Link></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="footer-bottom">
                <div>&copy; {new Date().getFullYear()} iLovePDF Clone. All rights reserved.</div>
                <div className="d-flex gap-4">
                    <Link to="/privacy" className="text-muted">Privacy Policy</Link>
                    <Link to="/terms" className="text-muted">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
