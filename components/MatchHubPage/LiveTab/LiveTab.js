/*
 * ==========================================================
 * COMPONENT: LiveTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/LiveTab.js
 ==========================================================
 */
import styles from './LiveTab.module.css';

export default function LiveTab() {
    // In the future, this component will have logic to check for a live match.
    const isMatchLive = false; // Placeholder

    return (
        <div className={styles.container}>
            {isMatchLive ? (
                <div>
                    <h2>Live Match Interface</h2>
                    {/* Event buttons (Goal, Card, etc.) will go here */}
                </div>
            ) : (
                <div className={styles.placeholder}>
                    <h3>No Match Currently In Progress</h3>
                    <p>When a match is live, this tab will activate to allow real-time event logging.</p>
                </div>
            )}
        </div>
    );
}
