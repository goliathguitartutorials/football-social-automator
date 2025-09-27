/*
 * ==========================================================
 * COMPONENT: LiveTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/LiveTab.js
 * ==========================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LiveTab.module.css';
import { GoalIcon, YellowCardIcon, RedCardIcon, SubIcon } from './LiveTabIcons';
import CountdownTimer from './CountdownTimer'; // NEW: Import the countdown component

export default function LiveTab() {
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null); // NEW: State for the next upcoming match

    // TODO: State for future event logging modal
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [selectedEventType, setSelectedEventType] = useState(null);

    useEffect(() => {
        const now = new Date();
        const liveMatchWindowMs = 150 * 60 * 1000; // 150 minutes in milliseconds

        const findMatches = () => {
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                setNextMatch(null);
                return;
            }

            // FIX: The original logic was missing the matchTime.
            // This now correctly combines date and time to get the exact start time.
            const foundLiveMatch = appData.matches.find(match => {
                const matchStartTime = new Date(`${match.matchDate} ${match.matchTime}`);
                const matchEndTime = new Date(matchStartTime.getTime() + liveMatchWindowMs);
                return now > matchStartTime && now < matchEndTime;
            });

            setLiveMatch(foundLiveMatch || null);

            // NEW: If no match is live, find the next upcoming one.
            if (!foundLiveMatch) {
                const upcomingMatches = appData.matches.filter(match => {
                    const matchStartTime = new Date(`${match.matchDate} ${match.matchTime}`);
                    return matchStartTime > now;
                });
                // Matches are already sorted by date in context, so the first one is the next one.
                setNextMatch(upcomingMatches[0] || null);
            } else {
                setNextMatch(null); // Ensure no 'next match' is shown when one is live
            }
        };

        findMatches();

    }, [appData.matches]);
    
    // TODO: Handler for future event logging modal
    // const handleEventClick = (eventType) => {
    //     setSelectedEventType(eventType);
    //     setIsModalOpen(true);
    // };

    const renderContent = () => {
        if (liveMatch) {
            return (
                <div className={styles.liveContainer}>
                    <h2 className={styles.liveHeader}>
                        LIVE: {liveMatch.homeTeamName} vs {liveMatch.awayTeamName}
                    </h2>
                    <div className={styles.eventGrid}>
                        <button className={styles.eventButton}>
                            <GoalIcon />
                            <span>Goal</span>
                        </button>
                        <button className={styles.eventButton}>
                            <YellowCardIcon />
                            <span>Yellow Card</span>
                        </button>
                        <button className={styles.eventButton}>
                            <RedCardIcon />
                            <span>Red Card</span>
                        </button>
                        <button className={styles.eventButton}>
                            <SubIcon />
                            <span>Substitution</span>
                        </button>
                    </div>
                </div>
            );
        }

        if (nextMatch) {
            const targetDate = `${nextMatch.matchDate} ${nextMatch.matchTime}`;
            return (
                <div className={styles.placeholder}>
                    <h3>Next Match</h3>
                    <p className={styles.nextMatchTeams}>{nextMatch.homeTeamName} vs {nextMatch.awayTeamName}</p>
                    <CountdownTimer targetDate={targetDate} />
                </div>
            );
        }

        return (
            <div className={styles.placeholder}>
                <h3>No Match Currently In Progress</h3>
                <p>When a match is live, this tab will activate to allow real-time event logging.</p>
            </div>
        );
    };

    return <div className={styles.container}>{renderContent()}</div>;
}
