import React from 'react';
import { NavLink } from 'react-router-dom';
import { allTools } from '../data/toolsData';
import { FiHome, FiX } from 'react-icons/fi';

const Sidebar = ({ collapsed, onClose }) => {
    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2 border-bottom mb-2">
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #e53935, #ff6f61)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>PDF</span>
                    </div>
                    <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>iLovePDF<span style={{ color: 'var(--primary-color)' }}>.in</span></span>
                </div>
                <button
                    onClick={onClose}
                    className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center border-0"
                    style={{ width: 32, height: 32 }}
                    title="Close menu"
                >
                    <FiX size={16} />
                </button>
            </div>

            <div className="sidebar-title">Menu</div>
            <nav className="sidebar-nav">
                <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <div className="sidebar-icon"><FiHome /></div>
                    <span className="sidebar-text">Home</span>
                </NavLink>
            </nav>

            <div className="sidebar-title">All Tools</div>
            <nav className="sidebar-nav pb-4">
                {allTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <NavLink
                            key={tool.id}
                            to={tool.path}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            data-tooltip={tool.name}
                            onClick={onClose}
                        >
                            <div className="sidebar-icon">
                                <Icon style={{ color: tool.color }} />
                            </div>
                            <span className="sidebar-text">{tool.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
