/*
 * ==========================================================
 * COMPONENT: Home Page
 * PAGE: /
 * FILE: /app/page.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import styles from './page.module.css';
import DesktopNav from '@/components/Navigation/DesktopNav';
import MobileNav from '@/components/Navigation/MobileNav';
import CreatePage from '@/components/CreatePage/CreatePage';
import SettingsPage from '@/components/SettingsPage/SettingsPage';
import AssetsPage from '@/components/AssetsPage/AssetsPage';
import SchedulePage from '@/components/SchedulePage/SchedulePage';

// --- Authentication Screen ---
const AuthScreen = () => {
    const {
        authKey,
        setAuthKey,
        authorizeAndFetchData,
        loading,
        error,
    } = useAppContext();

    const handleSubmit = (e) => {
        e.preventDefault();
        authorizeAndFetchData(authKey);
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h1>Glannau Social Media Automator</h1>
                <p>Please enter your key to continue.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Enter your key..."
                        value={authKey}
                        onChange={(e) => setAuthKey(e.target.value)}
                        className={styles.authInput}
                        disabled={loading}
                    />
                    <button type="submit" className={styles.authButton} disabled={loading}>
                        {loading ? 'Loading...' : 'Authorize'}
                    </button>
                </form>
                {error && <p className={styles.authError}>{error}</p>}
            </div>
        </div>
    );
};

// --- Main Content Renderer ---
const MainContent = ({ view, appData, onDataRefresh }) => {
    switch (view) {
        case 'create':
            return <CreatePage />;
        case 'schedule':
            return <SchedulePage appData={appData} onDataRefresh={onDataRefresh} />;
        case 'live':
            return <div><h2>Live Match Mode</h2><p>This feature is coming soon.</p></div>;
        case 'assets':
            return <AssetsPage appData={appData} onDataRefresh={onDataRefresh} />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <CreatePage />;
    }
};

// --- Main Page Component ---
export default function HomePage() {
    const [activeView, setActiveView] = useState('create');
    const { appData, authStatus, refreshAppData } = useAppContext();

    if (authStatus !== 'success') {
        return <AuthScreen />;
    }

    return (
        <div className={styles.pageContainer}>
            <DesktopNav activeView={activeView} setView={setActiveView} />
            <main className={styles.main}>
                <MainContent view={activeView} appData={appData} onDataRefresh={refreshAppData} />
            </main>
            <MobileNav activeView={activeView} setView={setActiveView} />
        </div>
    );
}
