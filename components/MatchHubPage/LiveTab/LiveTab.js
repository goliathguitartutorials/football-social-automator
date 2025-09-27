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
import { OverviewIcon, SquadIcon, GoalIcon, YellowCardIcon, RedCardIcon, SubIcon } from './LiveTabIcons';
import CountdownTimer from './CountdownTimer';
import EventForm from './EventForm/EventForm';
import MatchEventsPanel from './MatchEventsPanel/MatchEventsPanel';
import SquadPanel from './SquadPanel/SquadPanel';

export default function LiveTab() {
    // MODIFIED: Added authKey for API calls and isSubmitting for user feedback
    const { appData, authKey } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);
    const [view, setView] = useState('dashboard'); // dashboard | logEvent
    const [activeTab, setActiveTab] = useState('overview'); // overview | squad
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [prepopulatedMinute, setPrepopulatedMinute] = useState('');
    const [events, setEvents] = useState([]);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [elapsedTimeDisplay, setElapsedTimeDisplay] = useState("00:00");
    const [isSubmitting, setIsSubmitting] = useState(false); // New state
    const [apiError, setApiError] = useState(''); // New state for errors

    const calculateElapsedTime = useCallback(() => {
        if (!liveMatch) return { minute: 0, display: "00:00" };
        const kickOffTime = new Date(`${liveMatch.matchDate} ${liveMatch.matchTime}`);
        const now = new Date();
        const totalSeconds = Math.floor((now - kickOffTime) / 1000);
        if (totalSeconds < 0) return { minute: 0, display: "00:00" };

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        let displayMinute = 0;
        let gameMinute = 0;

        if (minutes < 45) {
            displayMinute = minutes;
            gameMinute = minutes + 1;
        } else if (minutes < 60) {
            return { minute: 45, display: "HT" };
        } else if (minutes < 105) {
            displayMinute = minutes - 15;
            gameMinute = minutes - 14;
        } else {
            return { minute: 90, display: "FT" };
        }

        const display = `${String(displayMinute).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: gameMinute, display };
    }, [liveMatch]);

    useEffect(() => {
        // This effect for finding matches remains the same
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
                    ...foundLiveMatch, homeTeamName, awayTeamName,
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                });
                setScore({ home: parseInt(foundLiveMatch.homeScore, 10) || 0, away: parseInt(foundLiveMatch.awayScore, 10) || 0 });
            } else {
                setLiveMatch(null);
                const upcomingMatches = appData.matches.filter(match => new Date(`${match.matchDate} ${match.matchTime}`) > now);
                setNextMatch(upcomingMatches[0] || null);
            }
        };
        findMatches();
    }, [appData.matches]);

    useEffect(() => {
        // This effect for the clock remains the same
        if (liveMatch) {
            const interval = setInterval(() => {
                const { display } = calculateElapsedTime();
                setElapsedTimeDisplay(display);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [liveMatch, calculateElapsedTime]);

    const handleEventClick = (eventType) => {
        const { minute } = calculateElapsedTime();
        setPrepopulatedMinute(minute);
        setSelectedEventType(eventType);
        setView('logEvent');
        setApiError(''); // Clear previous errors
    };

    const handleFormCancel = () => {
        setView('dashboard');
        setSelectedEventType(null);
    };

    // MODIFIED: This function now handles the API call
    const handleEventSubmit = async (eventData) => {
        setIsSubmitting(true);
        setApiError('');

        // 1. Prepare the data for the API
        const eventId = `event_${Date.now()}`;
        const apiPayload = {
            eventId: eventId,
            matchId: eventData.matchId,
            eventType: eventData.eventType,
            minute: eventData.minute,
            team: eventData.team, // 'home' or 'away'
            playerFullName: eventData.scorer || eventData.player || eventData.playerOff || '',
            assistByFullName: eventData.assist || eventData.playerOn || '',
        };

        try {
            // 2. Send data to the manage-match API route
            const response = await fetch('/api/manage-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authKey}`
                },
                body: JSON.stringify({
                    action: 'log_event',
                    matchData: apiPayload 
                })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to log event.');
            }

            // 3. Update local state on success
            const newEvent = { ...eventData, id: eventId };
            const newEvents = [...events, newEvent].sort((a, b) => a.minute - b.minute);
            setEvents(newEvents);
            
            const newHomeScore = newEvents.filter(e => e.eventType === 'Goal' && e.team === 'home').length;
            const newAwayScore = newEvents.filter(e => e.eventType === 'Goal' && e.team === 'away').length;
            setScore({ home: newHomeScore, away: newAwayScore });
            
            handleFormCancel();

        } catch (error) {
            console.error("API Error:", error);
            setApiError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER LOGIC ---

    if (view === 'logEvent') {
        return (
            <EventForm
                eventType={selectedEventType}
                match={liveMatch}
                onCancel={handleFormCancel}
                onSubmit={handleEventSubmit}
                initialMinute={prepopulatedMinute}
                isSubmitting={isSubmitting} /* Pass submitting state */
                apiError={apiError} /* Pass error message */
            />
        );
    }
    
    // The rest of the render logic remains unchanged...
    if (liveMatch) {
        return (
            <div className={styles.dashboardContainer}>
                <div className={styles.matchHeader}>
                    <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                    <div className={styles.scoreContainer}>
                        <span className={styles.score}>{score.home} - {score.away}</span>
                        <span className={styles.elapsedTime}>{elapsedTimeDisplay}</span>
                    </div>
                    <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                </div>

                <div className={styles.eventGrid}>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Goal')}><GoalIcon /><span>Goal</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')}><YellowCardIcon /><span>Yellow Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')}><RedCardIcon /><span>Red Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')}><SubIcon /><span>Substitution</span></button>
                </div>

                <div className={styles.detailsContainer}>
                    <div className={styles.tabBar}>
                        <button className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`} onClick={() => setActiveTab('overview')}><OverviewIcon /><span>Overview</span></button>
                        <button className={`${styles.tabButton} ${activeTab === 'squad' ? styles.active : ''}`} onClick={() => setActiveTab('squad')}><SquadIcon /><span>Squad</span></button>
                    </div>
                    <div className={styles.panelContainer}>
                        {activeTab === 'overview' && <MatchEventsPanel events={events} match={liveMatch} />}
                        {activeTab === 'squad' && <SquadPanel squadList={liveMatch.squadList} />}
                    </div>
                </div>
            </div>
        );
    }
    
    if (nextMatch) {
        const targetDate = `${nextMatch.matchDate} ${nextMatch.matchTime}`;
        return (
            <div className={styles.placeholder}>
                <h3>Next Match</h3>
                <p>{nextMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : nextMatch.opponent} vs {nextMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : nextMatch.opponent}</p>
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
