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
    // MODIFIED: Create a single line of text
    const teamType = match.team === 'first-team' ? 'First Team' : 'Development';
    const title = `${teamType}: ${match.homeOrAway === 'Home' ? 'vs' : '@'} ${match.opponent}`;

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent calendar day's click event
        onClick(match);
    };

    // MODIFIED: Add a dynamic class for the team-specific border
    const teamClass = match.team === 'first-team' ? styles.firstTeam : styles.developmentTeam;

    return (
        <div className={`${styles.preview} ${teamClass} ${isListView ? styles.listView : ''}`} onClick={handleClick}>
            <div className={styles.icon}><FootballIcon /></div>
            <div className={styles.details}>
                <span className={styles.title}>{title}</span>
            </div>
        </div>
    );
}
