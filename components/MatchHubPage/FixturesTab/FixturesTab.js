/*
 * ==========================================================
 * COMPONENT: FixturesTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/FixturesTab/FixturesTab.js
 ==========================================================
 */
// MODIFIED: Import the new EditIcon from the correct file
import { EditIcon } from '../MatchHubIcons';
import styles from './FixturesTab.module.css';

const MatchCard = ({ match, onEditClick }) => {
    const formatDateTime = (dateStr, timeStr) => {
        const date = new Date(`${dateStr}T${timeStr}`);
        const formattedDate = date.toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true 
        });
        return { formattedDate, formattedTime };
    };

    const { formattedDate, formattedTime } = formatDateTime(match.matchDate, match.matchTime);
    const teamType = match.team === 'first-team' ? 'First Team' : 'Development';

    return (
        <div className={styles.matchCard}>
            <div className={styles.matchInfo}>
                <div className={styles.metaLine}>
                    <p className={styles.competition}>{match.competition}</p>
                    <span className={`${styles.teamBadge} ${styles[match.team]}`}>{teamType}</span>
                </div>
                <h3 className={styles.teams}>
                    {match.homeOrAway === 'Home' ? 'Y Glannau' : match.opponent}
                    <span>vs</span>
                    {match.homeOrAway === 'Away' ? 'Y Glannau' : match.opponent}
                </h3>
                <p className={styles.venue}>{match.venue}</p>
            </div>
            <div className={styles.matchTime}>
                <p className={styles.date}>{formattedDate}</p>
                <p className={styles.time}>{formattedTime}</p>
            </div>
            <div className={styles.actions}>
                <button onClick={() => onEditClick(match)} className={styles.editButton}>
                    <EditIcon /> Edit
                </button>
            </div>
        </div>
    );
};

export default function FixturesTab({ matches, onEditClick }) {
    if (!matches || matches.length === 0) {
        return <p className={styles.notice}>No upcoming matches found.</p>;
    }

    return (
        <div className={styles.fixturesList}>
            {matches.map(match => (
                <MatchCard key={match.matchId} match={match} onEditClick={onEditClick} />
            ))}
        </div>
    );
}
