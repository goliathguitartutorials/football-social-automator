/*
 * ==========================================================
 * COMPONENT: MatchPreview
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/MatchPreview/MatchPreview.js
 * ==========================================================
 */
import styles from './MatchPreview.module.css';
import { FootballPitchIcon } from '../../Navigation/Icons'; // MODIFIED: Corrected import path and icon name

export default function MatchPreview({ match, onClick, isListView = false }) {
    const teamType = match.team === 'first-team' ? 'First Team' : 'Development';
    const title = `${teamType}: ${match.homeOrAway === 'Home' ? 'vs' : '@'} ${match.opponent}`;

    const handleClick = (e) => {
        e.stopPropagation(); 
        onClick(match);
    };

    const teamClass = match.team === 'first-team' ? styles.firstTeam : styles.developmentTeam;

    return (
        <div className={`${styles.preview} ${teamClass} ${isListView ? styles.listView : ''}`} onClick={handleClick}>
            <div className={styles.icon}><FootballPitchIcon /></div> {/* MODIFIED: Use the new icon component */}
            <div className={styles.details}>
                <span className={styles.title}>{title}</span>
            </div>
        </div>
    );
}
