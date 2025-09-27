/*
 * ==========================================================
 * COMPONENT: LiveTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/LiveTab.js
 * ==========================================================
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LiveTab.module.css';
import { GoalIcon, YellowCardIcon, RedCardIcon, SubIcon } from './LiveTabIcons';
import CountdownTimer from './CountdownTimer';
import EventForm from './EventForm/EventForm'; // NEW: Import the inline form

export default function LiveTab() {
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);

    // NEW: View state to switch between overview and the event form
    const [view, setView] = useState('overview');
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [prepopulatedMinute, setPrepopulatedMinute] = useState('');

    const [score, setScore] = useState({ home: 0, away: 0 });

    // NEW: State for the elapsed time display
    const [elapsedTimeDisplay, setElapsedTimeDisplay] = useState("0'");

    const calculateElapsedTime = useCallback(() => {
        if (!liveMatch) return { minute: 0, display: "0'" };

        const kickOffTime = new Date(`${liveMatch.matchDate} ${liveMatch.matchTime}`);
        const now = new Date();
        const totalMinutes = Math.floor((now - kickOffTime) / 60000);

        let minute = 0;
        let display = "0'";

        if (totalMinutes < 0) { // Match hasn't started yet
            return { minute: 0, display: "0'" };
        } else if (totalMinutes < 45) { // First half
            minute = totalMinutes + 1;
            display = `${minute}'`;
        } else if (totalMinutes < 60) { // Half time (assuming 15 min break)
            minute = 45;
            display = 'HT';
        } else if (totalMinutes < 105) { // Second half
            minute = (totalMinutes - 15) + 1;
            display = `${minute}'`;
        } else { // Full time
            minute = 90;
            display = 'FT';
        }
        return { minute, display };
    }, [liveMatch]);


    useEffect(() => {
        // Effect for finding the live match
        const now = new Date();
        const liveMatchWindowMs = 150 * 60 * 1000;

        const findMatches = () => {
            if (!appData.matches || appData.matches.length === 0) return;
            
            const foundLiveMatch = appData.matches.find(match => {
                const matchStartTime = new Date(`${match.matchDate} ${match.matchTime}`);
                const matchEndTime = new Date(matchStartTime.getTime() + liveMatchWindowMs);
                return now > matchStartTime && now < matchEndTime;
            });

            if (foundLiveMatch) {
                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                
                setLiveMatch({
                    ...foundLiveMatch,
                    homeTeamName,
                    awayTeamName,
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                });
                
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

    useEffect(() => {
        // NEW: Effect for updating the elapsed time clock every 10 seconds
        if (liveMatch) {
            const interval = setInterval(() => {
                const { display } = calculateElapsedTime();
                setElapsedTimeDisplay(display);
            }, 10000); // Update every 10 seconds is enough for a display
            
            // Set initial time immediately
            const { display } = calculateElapsedTime();
            setElapsedTimeDisplay(display);

            return () => clearInterval(interval);
        }
    }, [liveMatch, calculateElapsedTime]);


    const handleEventClick = (eventType) => {
        const { minute } = calculateElapsedTime();
        setPrepopulatedMinute(minute);
        setSelectedEventType(eventType);
        setView('logEvent'); // Switch to the form view
    };

    const handleFormCancel = () => {
        setView('overview'); // Switch back to the overview
        setSelectedEventType(null);
    };
    
    const handleEventSubmit = (eventData) => {
        console.log("Event Logged:", eventData);
        // TODO: Add API call to /api/manage-match here
        
        if (eventData.eventType === 'Goal' && eventData.scorer !== 'Own Goal') {
            const ourTeamName = liveMatch.homeOrAway === 'Home' ? liveMatch.homeTeamName : liveMatch.awayTeamName;
            // This logic assumes a goal for our team. Needs refinement for away goals.
            if (liveMatch.homeTeamName === ourTeamName) {
                setScore(prevScore => ({ ...prevScore, home: prevScore.home + 1 }));
            } else {
                setScore(prevScore => ({ ...prevScore, away: prevScore.away + 1 }));
            }
        }
        
        handleFormCancel(); // Go back to overview on submit
    };

    if (liveMatch && view === 'logEvent') {
        return (
            <EventForm
                eventType={selectedEventType}
                match={liveMatch}
                onCancel={handleFormCancel}
                onSubmit={handleEventSubmit}
                initialMinute={prepopulatedMinute}
            />
        );
    }
    
    if (liveMatch && view === 'overview') {
        return (
            <div className={styles.liveContainer}>
                <div className={styles.matchHeader}>
                    <div className={styles.teamInfo}>
                        <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                    </div>
                    <div className={styles.scoreContainer}>
                        <span className={styles.score}>{score.home} - {score.away}</span>
                        {/* NEW: Elapsed time display */}
                        <span className={styles.elapsedTime}>{elapsedTimeDisplay}</span>
                    </div>
                    <div className={styles.teamInfo}>
                        <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                    </div>
                </div>
                <div className={styles.eventGrid}>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Goal')}><GoalIcon /><span>Goal</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')}><YellowCardIcon /><span>Yellow Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')}><RedCardIcon /><span>Red Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')}><SubIcon /><span>Substitution</span></button>
                </div>
            </div>
        );
    }

    if (nextMatch) {
        // ... (countdown logic remains the same)
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
}
