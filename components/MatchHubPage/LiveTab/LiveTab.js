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

export default function LiveTab() {
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);

    // TODO: State for future event logging modal
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [selectedEventType, setSelectedEventType] = useState(null);

    useEffect(() => {
        // This effect runs whenever the component mounts or the match data changes.
        // It checks for a match that is currently "live".
        
        const now = new Date();
        const liveMatchWindowMs = 150 * 60 * 1000; // 150 minutes in milliseconds

        const findLiveMatch = () => {
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                return;
            }

            const foundMatch = appData.matches.find(match => {
                const matchStartTime = new Date(match.matchDate);
                const matchEndTime = new Date(matchStartTime.getTime() + liveMatchWindowMs);
                
                // A match is "live" if the current time is after it started
                // and before the 150-minute window has passed.
                return now > matchStartTime && now < matchEndTime;
            });

            setLiveMatch(foundMatch || null);
        };

        findLiveMatch();
        
        // Optional: Set up an interval to re-check every minute if needed,
        // though re-checking on tab navigation is usually sufficient.

    }, [appData.matches]);
    
    // TODO: Handler for future event logging modal
    // const handleEventClick = (eventType) => {
    //     setSelectedEventType(eventType);
    //     setIsModalOpen(true);
    // };

    return (
        <div className={styles.container}>
            {liveMatch ? (
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
            ) : (
                <div className={styles.placeholder}>
                    <h3>No Match Currently In Progress</h3>
                    <p>When a match is live, this tab will activate to allow real-time event logging.</p>
                </div>
            )}
        </div>
    );
}
