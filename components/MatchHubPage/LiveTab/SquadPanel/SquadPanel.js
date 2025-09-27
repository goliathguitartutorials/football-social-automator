/*
 * ==========================================================
 * COMPONENT: SquadPanel
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/SquadPanel/SquadPanel.js
 * ==========================================================
 */
import styles from './SquadPanel.module.css';

export default function SquadPanel({ squadList }) {
    if (!squadList || squadList.length === 0) {
        return <p className={styles.noSquad}>Squad information not available for this match.</p>;
    }

    return (
        <div className={styles.squadGrid}>
            {squadList.map((player, index) => (
                <div key={index} className={styles.playerItem}>
                    {player}
                </div>
            ))}
        </div>
    );
}
