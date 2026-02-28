import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import LoginLimitModal from './LoginLimitModal';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { user } = useAuth();
    const location = useLocation();
    const isToolPage = location.pathname.startsWith('/tool/') || location.pathname.startsWith('/image-editor');

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    return (
        <div className="app-shell">
            {user && (
                <>
                    <div className={`sidebar-overlay ${sidebarCollapsed ? 'collapsed' : ''}`} onClick={() => setSidebarCollapsed(true)}></div>
                    <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
                </>
            )}
            <div className="main-wrapper">
                <Topbar toggleSidebar={toggleSidebar} />
                <main className={`main-content${isToolPage ? ' main-content--tool' : ''}`}>
                    <Outlet />
                    {!isToolPage && <Footer />}
                </main>
            </div>
            <LoginLimitModal />
        </div>
    );
};

export default Layout;
