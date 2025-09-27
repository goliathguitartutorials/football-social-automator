/*
 * ==========================================================
 * COMPONENT: ArchiveTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/ArchiveTab/ArchiveTab.js
 * ==========================================================
 */
'use client';

import { useState, useMemo } from 'react';
import styles from './ArchiveTab.module.css';
import { EditIcon, FootballIcon, ArchiveIcon } from '../MatchHubIcons';

export default function ArchiveTab({ matches }) {
    const [selectedMatch, setSelectedMatch] = useState(null);

    const archivedMatches = useMemo(() => {
        if (!matches) return [];
        // FIXED: Changed 'Archived' to 'archived' to match the database value.
        return matches
            .filter(match => match.status === 'archived')
            .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate)); // Most recent first
    }, [matches]);

    const handleEditClick = (match) => {
        // This will be implemented in the next step.
        alert(`Editing for ${match.opponent} is not yet implemented.`);
    };

    if (archivedMatches.length === 0) {
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
            <h2 className={styles.header}>Archived Matches</h2>
            <ul className={styles.matchList}>
                {archivedMatches.map(match => {
                    const homeTeam = match.homeOrAway === 'Home' ? 'CPD Y Glannau' : match.opponent;
                    const awayTeam = match.homeOrAway === 'Away' ? 'CPD Y Glannau' : match.opponent;
                    const homeScore = match.homeScore || 0;
                    const awayScore = match.awayScore || 0;

                    return (
                        <li key={match.matchId} className={styles.matchItem}>
                            <div className={styles.matchInfo}>
                                <span className={styles.matchDate}>{new Date(match.matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <div className={styles.matchTeams}>
                                    <FootballIcon />
                                    <span>{homeTeam} vs {awayTeam}</span>
                                </div>
                            </div>
                            <div className={styles.matchResult}>
                                <span className={styles.finalScore}>{homeScore} - {awayScore}</span>
                                <button className={styles.editButton} onClick={() => handleEditClick(match)}>
                                    <EditIcon />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
