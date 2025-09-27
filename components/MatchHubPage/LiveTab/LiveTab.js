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
import CountdownTimer from './CountdownTimer';
import EventModal from './EventModal/EventModal'; // NEW: Import the modal component

export default function LiveTab() {
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);

    // NEW: State for the event logging modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState(null);

    // NEW: State for managing the score
    const [score, setScore] = useState({ home: 0, away: 0 });

    useEffect(() => {
        const now = new Date();
        const liveMatchWindowMs = 150 * 60 * 1000;

        const findMatches = () => {
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                setNextMatch(null);
                return;
            }

            const foundLiveMatch = appData.matches.find(match => {
                const matchStartTime = new Date(`${match.matchDate} ${match.matchTime}`);
                const matchEndTime = new Date(matchStartTime.getTime() + liveMatchWindowMs);
                return now > matchStartTime && now < matchEndTime;
            });

            if (foundLiveMatch) {
                // FIX: Derive team names correctly from the match object
                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;

                // NEW: Populate the liveMatch object with correct team names
                const processedMatch = {
                    ...foundLiveMatch,
                    homeTeamName,
                    awayTeamName,
                    // NEW: Parse the squad string into an array of player names
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                };

                setLiveMatch(processedMatch);
                
                // NEW: Set initial score from match data, defaulting to 0
                setScore({
                    home: parseInt(foundLiveMatch.homeScore, 10) || 0,
                    away: parseInt(foundLiveMatch.awayScore, 10) || 0,
                });

            } else {
                setLiveMatch(null);
                const upcomingMatches = appData.matches.filter(match => new Date(`${match.matchDate} ${match.matchTime}`) > now);
                setNextMatch(upcomingMatches[0] || null);
            }
        };

        findMatches();
    }, [appData.matches]);

    // NEW: Handler to open the event logging modal
    const handleEventClick = (eventType) => {
        setSelectedEventType(eventType);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedEventType(null);
    };
    
    // NEW: Handler to process the event data from the modal
    const handleEventSubmit = (eventData) => {
        console.log("Event Logged:", eventData);
        // TODO: Add API call to /api/manage-match here
        
        // Example of updating score locally after a goal is logged
        if (eventData.eventType === 'Goal') {
            if (eventData.team === liveMatch.homeTeamName) {
                setScore(prevScore => ({ ...prevScore, home: prevScore.home + 1 }));
            } else {
                setScore(prevScore => ({ ...prevScore, away: prevScore.away + 1 }));
            }
        }
        
        handleModalClose(); // Close modal on submit
    };


    const renderContent = () => {
        if (liveMatch) {
            return (
                <div className={styles.liveContainer}>
                    <div className={styles.matchHeader}>
                        <div className={styles.teamInfo}>
                            <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                        </div>
                        <div className={styles.scoreContainer}>
                            <span className={styles.score}>{score.home} - {score.away}</span>
                            <span className={styles.matchTime}>{liveMatch.matchTime} K.O. @ {liveMatch.venue}</span>
                        </div>
                        <div className={styles.teamInfo}>
                            <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                        </div>
                    </div>

                    <div className={styles.eventGrid}>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Goal')}>
                            <GoalIcon />
                            <span>Goal</span>
                        </button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')}>
                            <YellowCardIcon />
                            <span>Yellow Card</span>
                        </button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')}>
                            <RedCardIcon />
                            <span>Red Card</span>
                        </button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')}>
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
                    <p className={styles.nextMatchTeams}>{nextMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : nextMatch.opponent} vs {nextMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : nextMatch.opponent}</p>
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

    return (
        <div className={styles.container}>
            {renderContent()}
            {isModalOpen && (
                <EventModal 
                    eventType={selectedEventType}
                    match={liveMatch}
                    onClose={handleModalClose}
                    onSubmit={handleEventSubmit}
                />
            )}
        </div>
    );
}
