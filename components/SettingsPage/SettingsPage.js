/*
 * =================================================================
 * COMPONENT: Settings Page
 * PAGE: / (Rendered on Settings tab)
 * FILE: /components/SettingsPage/SettingsPage.js
 * =================================================================
 */
'use client';

import styles from './SettingsPage.module.css';
import { useAppContext } from '@/app/context/AppContext';

export default function SettingsPage() {
    const {
        authKey,
        setAuthKey,
        authorizeAndFetchData,
        loading,
        error,
        authStatus
    } = useAppContext();

    const handleAuthorize = () => {
        authorizeAndFetchData(authKey);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Settings</h2>
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Authorization</h3>
                <p className={styles.cardDescription}>
                    Enter your Authorization Key below to connect the application to the backend and load your club's assets.
                </p>
                <div className={styles.authSection}>
                    <label htmlFor="authKey" className={styles.authLabel}>
                        Authorization Key
                    </label>
                    <div className={styles.authInputContainer}>
                        <input
                            id="authKey"
                            type="password"
                            className={styles.authInput}
                            placeholder="Enter key to load data..."
                            value={authKey}
                            onChange={(e) => setAuthKey(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAuthorize()}
                        />
                        <button
                            onClick={handleAuthorize}
                            className={styles.authButton}
                            disabled={loading}
                        >
                            {loading ? '...' : 'Authorize'}
                        </button>
                    </div>

                    <div className={styles.authStatus}>
                        {authStatus === 'success' && (
                            <p className={styles.successText}>✓ Authorized. Data loaded successfully.</p>
                        )}
                        {authStatus === 'error' && (
                            <p className={styles.errorText}>{error}</p>
                        )}
                         {authStatus === 'idle' && !error && (
                            <p className={styles.idleText}>Awaiting authorization...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
