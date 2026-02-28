import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiMenu, FiX, FiChevronDown, FiUser, FiHelpCircle,
    FiMessageCircle, FiLogOut, FiChevronRight
} from 'react-icons/fi';
import { FcGoogle, FcApproval } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { toolGroups } from '../data/toolsData';

const Topbar = ({ toggleSidebar }) => {
    const { user, openLoginModal, openSignupModal, logout } = useAuth();
    const location = useLocation();

    const getUserDisplay = () => {
        const metadata = user?.user_metadata || {};
        const fullName = metadata.full_name || metadata.name || '';
        const firstName = fullName.trim().split(' ')[0] || user?.email?.split('@')[0] || 'User';
        const avatar = metadata.avatar_url || metadata.picture || null;
        return { firstName, avatar };
    };

    const userDisplay = user ? getUserDisplay() : null;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [megaOpen, setMegaOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileNavRef = useRef(null);
    const megaRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
            if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close mobile nav on route change
    useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

    // Lock body scroll when nav open
    useEffect(() => {
        document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileNavOpen]);

    return (
        <>
            <header className="topbar">
                <div className="topbar-left">
                    {/* Desktop sidebar toggle (logged-in only) */}
                    {user && (
                        <button className="toggle-btn d-none d-lg-flex" onClick={toggleSidebar}>
                            <FiMenu />
                        </button>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="mob-nav-toggle d-flex d-lg-none"
                        onClick={() => setMobileNavOpen(o => !o)}
                        aria-label="Toggle navigation"
                    >
                        {mobileNavOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>

                    <Link to="/" className="logo-brand">
                        <div className="logo-mark">PDF</div>
                        <span>iLovePDF<span style={{ color: 'var(--primary-color)' }}>.in</span></span>
                    </Link>
                </div>

                {/* Desktop center nav */}
                <div className="topbar-center d-none d-lg-flex flex-grow-1 justify-content-center align-items-center gap-1">
                    <Link to="/tool/jpg-to-pdf" className="topnav-link">JPG to PDF</Link>
                    <Link to="/tool/split-pdf" className="topnav-link">Split PDF</Link>
                    <Link to="/image-editor" className="topnav-link topnav-link--hot">
                        Image Editor <span className="topnav-hot-badge">HOT</span>
                    </Link>
                    <Link to="/tool/compress-pdf" className="topnav-link">Compress PDF</Link>

                    <div
                        ref={megaRef}
                        className="mega-menu-trigger topnav-link d-flex align-items-center gap-1"
                        onClick={() => setMegaOpen(o => !o)}
                    >
                        All PDF Tools <FiChevronDown size={14} style={{ transition: 'transform 0.2s', transform: megaOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                        <div className={`mega-dropdown mega-dropdown-full${megaOpen ? ' mega-force-open' : ''}`}>
                            {toolGroups.map(group => (
                                <div key={group.id} className="mega-group">
                                    <div className="mega-group-title">{group.title}</div>
                                    <div className="d-flex flex-column gap-1">
                                        {group.items.map(item => {
                                            const Icon = item.icon;
                                            return (
                                                <Link to={item.path} key={item.id} className="mega-item">
                                                    <span className="mega-item-icon" style={{ background: item.bgColor }}>
                                                        <Icon style={{ color: item.color }} />
                                                    </span>
                                                    <span className="mega-item-name">{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — auth */}
                <div className="topbar-right">
                    {!user ? (
                        <div className="d-flex align-items-center gap-2">
                            <button className="auth-btn" onClick={openLoginModal}>
                                <FiUser className="auth-icon" />
                                <span className="d-none d-sm-inline">Login</span>
                            </button>
                            <button
                                className="btn btn-danger fw-semibold px-3 py-2 rounded-pill shadow-sm"
                                style={{ fontSize: '0.9rem' }}
                                onClick={openSignupModal}
                            >
                                Sign up
                            </button>
                        </div>
                    ) : (
                        <div className="position-relative" ref={dropdownRef}>
                            <div
                                className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '4px 8px' }}
                            >
                                <span className="fw-semibold d-none d-md-flex align-items-center gap-1 text-dark">
                                    {userDisplay.firstName} <FcApproval title="Verified User" />
                                </span>
                                {userDisplay.avatar ? (
                                    <img src={userDisplay.avatar} alt="Avatar" className="avatar rounded-circle border" style={{ width: 38, height: 38, objectFit: 'cover' }} />
                                ) : (
                                    <div className="avatar rounded-circle d-flex align-items-center justify-content-center bg-danger text-white fw-bold shadow-sm" style={{ width: 38, height: 38, fontSize: '1.2rem' }}>
                                        {userDisplay.firstName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <FiChevronDown className="text-muted d-none d-md-block" />
                            </div>

                            {isDropdownOpen && (
                                <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border" style={{ width: '240px', zIndex: 1050, overflow: 'hidden' }}>
                                    <div className="p-3 bg-light border-bottom">
                                        <div className="fw-bold text-dark d-flex align-items-center gap-1">
                                            {userDisplay.firstName}<FcApproval />
                                        </div>
                                        <div className="small text-muted text-truncate">{user?.email}</div>
                                    </div>
                                    <div className="p-2 d-flex flex-column">
                                        <Link to="/" className="text-decoration-none text-dark p-2 rounded d-flex align-items-center gap-2" onClick={() => setIsDropdownOpen(false)}><FiUser className="text-muted" /> Profile Dashboard</Link>
                                        <Link to="/" className="text-decoration-none text-dark p-2 rounded d-flex align-items-center gap-2" onClick={() => setIsDropdownOpen(false)}><FiMessageCircle className="text-muted" /> Contact Support</Link>
                                        <Link to="/" className="text-decoration-none text-dark p-2 rounded d-flex align-items-center gap-2" onClick={() => setIsDropdownOpen(false)}><FiHelpCircle className="text-muted" /> FAQs &amp; Help</Link>
                                    </div>
                                    <div className="border-top p-2">
                                        <button className="btn btn-light w-100 text-danger text-start d-flex align-items-center gap-2 fw-semibold" onClick={() => { logout(); setIsDropdownOpen(false); }}>
                                            <FiLogOut /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* ── Mobile Nav Drawer ── */}
            {/* Backdrop */}
            <div
                className={`mob-nav-backdrop ${mobileNavOpen ? 'open' : ''}`}
                onClick={() => setMobileNavOpen(false)}
            />

            {/* Drawer panel */}
            <nav ref={mobileNavRef} className={`mob-nav-drawer ${mobileNavOpen ? 'open' : ''}`}>
                {/* Drawer header */}
                <div className="mob-nav-header">
                    <div className="logo-brand" style={{ textDecoration: 'none' }}>
                        <div className="logo-mark" style={{ fontSize: '0.75rem', padding: '4px 7px' }}>PDF</div>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                            iLovePDF<span style={{ color: 'var(--primary-color)' }}>.in</span>
                        </span>
                    </div>
                    <button className="mob-nav-close" onClick={() => setMobileNavOpen(false)}>
                        <FiX size={22} />
                    </button>
                </div>

                {/* Quick links */}
                <div className="mob-nav-quick">
                    <Link to="/tool/jpg-to-pdf" className="mob-nav-quick-link" onClick={() => setMobileNavOpen(false)}>JPG to PDF</Link>
                    <Link to="/tool/split-pdf" className="mob-nav-quick-link" onClick={() => setMobileNavOpen(false)}>Split PDF</Link>
                    <Link to="/image-editor" className="mob-nav-quick-link mob-nav-hot" onClick={() => setMobileNavOpen(false)}>Image Editor <span className="topnav-hot-badge">HOT</span></Link>
                    <Link to="/tool/compress-pdf" className="mob-nav-quick-link" onClick={() => setMobileNavOpen(false)}>Compress PDF</Link>
                </div>

                <div className="mob-nav-divider">All PDF Tools</div>

                {/* Grouped accordion */}
                <div className="mob-nav-groups">
                    {toolGroups.map(group => (
                        <div key={group.id} className="mob-nav-group">
                            <button
                                className="mob-nav-group-toggle"
                                onClick={() => setExpandedGroup(g => g === group.id ? null : group.id)}
                            >
                                <span>{group.title}</span>
                                <FiChevronRight
                                    size={16}
                                    style={{
                                        transform: expandedGroup === group.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </button>
                            {expandedGroup === group.id && (
                                <div className="mob-nav-items">
                                    {group.items.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                className="mob-nav-item"
                                                onClick={() => setMobileNavOpen(false)}
                                            >
                                                <span className="mob-nav-item-icon" style={{ background: item.bgColor, color: item.color }}>
                                                    <Icon size={14} />
                                                </span>
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </nav>
        </>
    );
};

export default Topbar;
