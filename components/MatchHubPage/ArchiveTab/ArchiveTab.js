/*
 * ==========================================================
 * COMPONENT: ArchiveTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/ArchiveTab/ArchiveTab.js
 * ==========================================================
 */
'use client';

import { useMemo } from 'react';
import styles from './ArchiveTab.module.css';
import { ArchiveIcon } from '../MatchHubIcons';

const ArchiveListItem = ({ match }) => {
    const teamType = match.team === 'first-team' ? 'First Team' : 'Development';
    const homeTeam = match.homeOrAway === 'Home' ? 'Y Glannau' : match.opponent;
    const awayTeam = match.homeOrAway === 'Away' ? 'Y Glannau' : match.opponent;
    const homeScore = match.homeScore ?? '0';
    const awayScore = match.awayScore ?? '0';

    return (
        <div className={`${styles.archiveListItem} ${styles[match.team]}`}>
            <div className={styles.scoreInfo}>
                <p>{homeScore} - {awayScore}</p>
            </div>
            <div className={styles.matchDetails}>
                <h4 className={styles.teams}>
                    {homeTeam}
                    <span>vs</span>
                    {awayTeam}
                </h4>
                <div className={styles.meta}>
                    <span>🏆 {match.competition}</span>
                    <span>📍 {match.venue}</span>
                    <span className={`${styles.teamBadge} ${styles[match.team]}`}>{teamType}</span>
                </div>
            </div>
        </div>
    );
};

export default function ArchiveTab({ matches }) {
    const groupedMatches = useMemo(() => {
        if (!matches) return {};

        const archived = matches.filter(match => match.status === 'archived');

        return archived.reduce((acc, match) => {
            const date = new Date(`${match.matchDate}T00:00:00Z`);
            const dateKey = date.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(match);
            return acc;
        }, {});
    }, [matches]);

    const sortedDateKeys = Object.keys(groupedMatches).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDateKeys.length === 0) {
        return (
            <div className={styles.placeholder}>
                <ArchiveIcon />
                <h3>No Archived Matches</h3>
                <p>When you finish and archive a match from the Live tab, it will appear here.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* The h2 title has been removed */}
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
                                <ArchiveListItem
                                    key={match.matchId}
                                    match={match}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
