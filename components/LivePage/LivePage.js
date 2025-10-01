/*
 * ==========================================================
 * COMPONENT: LivePage
 * PAGE: Live
 * FILE: /components/LivePage/LivePage.js
 * ==========================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LivePage.module.css';
import CountdownTimer from './CountdownTimer';

export default function LivePage() {
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);

    useEffect(() => {
        const findMatches = () => {
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                setNextMatch(null);
                return;
            }

            const now = new Date();
            const liveMatchWindowMs = 120 * 60 * 1000;

            // 1. Find if a match is currently in its live window
            const currentLiveMatch = appData.matches.find(match => {
                // REMOVED: The check for `match.status` has been deleted.
                const matchScheduledTime = new Date(`${match.matchDate}T${match.matchTime}`);
                const matchEndTime = new Date(matchScheduledTime.getTime() + liveMatchWindowMs);
                return now >= matchScheduledTime && now <= matchEndTime;
            });

            if (currentLiveMatch) {
                const homeTeamName = currentLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : currentLiveMatch.opponent;
                const awayTeamName = currentLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : currentLiveMatch.opponent;
                
                setLiveMatch({ ...currentLiveMatch, homeTeamName, awayTeamName });
                setNextMatch(null);
            } else {
                // 2. If no live match, find the next upcoming match
                const upcomingMatches = appData.matches
                    .filter(match => {
                        // REMOVED: The check for `match.status` has been deleted.
                        const matchScheduledTime = new Date(`${match.matchDate}T${match.matchTime}`);
                        return matchScheduledTime > now;
                    })
                    .sort((a, b) => new Date(`${a.matchDate}T${a.matchTime}`) - new Date(`${b.matchDate}T${b.matchTime}`));

                setLiveMatch(null);
                setNextMatch(upcomingMatches[0] || null);
            }
        };

        findMatches();
        const intervalId = setInterval(findMatches, 30000);

        return () => clearInterval(intervalId);

    }, [appData.matches]);


    // RENDER STATE 1: A match is currently in progress
    if (liveMatch) {
        return (
            <div className={styles.dashboardContainer}>
                <div className={styles.matchHeader}>
                    <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                    <div className={styles.scoreContainer}>
                        <span className={styles.score}>- V -</span>
                        <span className={styles.elapsedTime}>Match in Progress</span>
                    </div>
                    <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                </div>
            </div>
        );
    }

    // RENDER STATE 2: No live match, but an upcoming match exists
    if (nextMatch) {
        const targetDate = `${nextMatch.matchDate}T${nextMatch.matchTime}`;
        const homeTeam = nextMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : nextMatch.opponent;
        const awayTeam = nextMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : nextMatch.opponent;
        return (
            <div className={styles.placeholder}>
                <h3>Next Match</h3>
                <p>{homeTeam} vs {awayTeam}</p>
                <CountdownTimer targetDate={targetDate} />
            </div>
        );
    }

    // RENDER STATE 3: No live or upcoming matches found
    return (
        <div className={styles.placeholder}>
            <h3>No Match Currently In Progress</h3>
            <p>Check the schedule for upcoming matches.</p>
        </div>
    );
}
