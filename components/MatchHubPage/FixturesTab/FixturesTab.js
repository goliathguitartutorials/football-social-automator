/*
 * ==========================================================
 * COMPONENT: FixturesTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/FixturesTab/FixturesTab.js
 ==========================================================
 */
import { useMemo } from 'react';
import { EditIcon, AddIcon } from '../MatchHubIcons';
import styles from './FixturesTab.module.css';

const FixtureListItem = ({ match, onEditClick }) => {
    const { formattedTime } = useMemo(() => {
        const date = new Date(`${match.matchDate}T${match.matchTime}`);
        const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        return { formattedTime: time };
    }, [match.matchDate, match.matchTime]);

    const teamType = match.team === 'first-team' ? 'First Team' : 'Development';

    // MODIFIED: The entire item is now a button that triggers the edit action.
    return (
        <button onClick={() => onEditClick(match)} className={`${styles.fixtureListItem} ${styles[match.team]}`}>
            <div className={styles.timeInfo}>
                <p>{formattedTime}</p>
            </div>
            <div className={styles.matchDetails}>
                <h4 className={styles.teams}>
                    {match.homeOrAway === 'Home' ? 'Y Glannau' : match.opponent}
                    <span>vs</span>
                    {match.homeOrAway === 'Away' ? 'Y Glannau' : match.opponent}
                </h4>
                <div className={styles.meta}>
                    <span>🏆 {match.competition}</span>
                    <span>📍 {match.venue}</span>
                    <span className={`${styles.teamBadge} ${styles[match.team]}`}>{teamType}</span>
                </div>
            </div>
            {/* REMOVED: The actions div with the edit button has been removed. */}
        </button>
    );
};

export default function FixturesTab({ matches, onEditClick, onAddNewMatch }) {
    const groupedMatches = useMemo(() => {
        if (!matches) return {};

        const unarchived = matches.filter(match => match.status !== 'archived');

        return unarchived.reduce((acc, match) => {
            const date = new Date(`${match.matchDate}T00:00:00Z`);
            const dateKey = date.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(match);
            return acc;
        }, {});
    }, [matches]);

    const sortedDateKeys = Object.keys(groupedMatches).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDateKeys.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.fixturesHeader}>
                    <h2>Upcoming Fixtures</h2>
                    <button onClick={onAddNewMatch} className={styles.addMatchButton}>
                        <AddIcon /> <span>Add New Match</span>
                    </button>
                </div>
                <div className={styles.notice}>
                    <p>No upcoming matches found.</p>
                    <span>Click "Add New Match" to schedule one.</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.fixturesHeader}>
                <h2>Upcoming Fixtures</h2>
                <button onClick={onAddNewMatch} className={styles.addMatchButton}>
                    <AddIcon /> <span>Add New Match</span>
                </button>
            </div>

            {sortedDateKeys.map(dateKey => {
                const date = new Date(`${dateKey}T00:00:00Z`);
                const displayDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                const matchesForDay = groupedMatches[dateKey];

                return (
                    <div key={dateKey} className={styles.dayGroup}>
                        <h3>{displayDate}</h3>
                        <div className={styles.matchList}>
                            {matchesForDay.map(match => (
                                <FixtureListItem
                                    key={match.matchId}
                                    match={match}
                                    onEditClick={onEditClick}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
