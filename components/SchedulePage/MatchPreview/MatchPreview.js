/*
 * ==========================================================
 * COMPONENT: MatchPreview
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/MatchPreview/MatchPreview.js
 * ==========================================================
 */
import styles from './MatchPreview.module.css';
import { FootballIcon } from '@/components/MatchHubPage/MatchHubIcons';

export default function MatchPreview({ match, onClick, isListView = false }) {
    const title = match.homeOrAway === 'Home' 
        ? `vs ${match.opponent}` 
        : `@ ${match.opponent}`;

    const teamType = match.team === 'first-team' ? 'First Team' : 'Dev.';

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent calendar day's click event
        onClick(match);
    };

    return (
        <div className={`${styles.preview} ${isListView ? styles.listView : ''}`} onClick={handleClick}>
            <div className={styles.icon}><FootballIcon /></div>
            <div className={styles.details}>
                <span className={styles.title}>{title}</span>
                <span className={styles.teamType}>{teamType}</span>
            </div>
        </div>
    );
}
