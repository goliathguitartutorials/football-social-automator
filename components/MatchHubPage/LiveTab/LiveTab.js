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
    const { appData } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);
    const [view, setView] = useState('dashboard'); // dashboard | logEvent
    const [activeTab, setActiveTab] = useState('overview'); // overview | squad
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [prepopulatedMinute, setPrepopulatedMinute] = useState('');
    const [events, setEvents] = useState([]);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [elapsedTimeDisplay, setElapsedTimeDisplay] = useState("00:00");

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

        if (minutes < 45) { // First half
            displayMinute = minutes;
            gameMinute = minutes + 1;
        } else if (minutes < 60) { // Half time (15 min break)
            return { minute: 45, display: "HT" };
        } else if (minutes < 105) { // Second half
            displayMinute = minutes - 15;
            gameMinute = minutes - 14;
        } else { // Full time
            return { minute: 90, display: "FT" };
        }

        const display = `${String(displayMinute).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: gameMinute, display };

    }, [liveMatch]);

    useEffect(() => {
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
        if (liveMatch) {
            const interval = setInterval(() => {
                const { display } = calculateElapsedTime();
                setElapsedTimeDisplay(display);
            }, 1000); // Update every second
            return () => clearInterval(interval);
        }
    }, [liveMatch, calculateElapsedTime]);

    const handleEventClick = (eventType) => {
        const { minute } = calculateElapsedTime();
        setPrepopulatedMinute(minute);
        setSelectedEventType(eventType);
        setView('logEvent');
    };

    const handleFormCancel = () => {
        setView('dashboard');
        setSelectedEventType(null);
    };

    const handleEventSubmit = (eventData) => {
        const newEvent = { ...eventData, id: Date.now() };
        const newEvents = [...events, newEvent];
        setEvents(newEvents);

        // Recalculate score from the new events list
        const newHomeScore = newEvents.filter(e => e.eventType === 'Goal' && e.team === 'home').length;
        const newAwayScore = newEvents.filter(e => e.eventType === 'Goal' && e.team === 'away').length;
        setScore({ home: newHomeScore, away: newAwayScore });
        
        // TODO: Add API call to /api/manage-match here
        console.log("Event Logged:", newEvent);
        
        handleFormCancel();
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
            />
        );
    }

    if (liveMatch) {
        return (
            <div className={styles.dashboardContainer}>
                {/* Score Header */}
                <div className={styles.matchHeader}>
                    <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                    <div className={styles.scoreContainer}>
                        <span className={styles.score}>{score.home} - {score.away}</span>
                        <span className={styles.elapsedTime}>{elapsedTimeDisplay}</span>
                    </div>
                    <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                </div>

                {/* Event Logging Buttons */}
                <div className={styles.eventGrid}>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Goal')}><GoalIcon /><span>Goal</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')}><YellowCardIcon /><span>Yellow Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')}><RedCardIcon /><span>Red Card</span></button>
                    <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')}><SubIcon /><span>Substitution</span></button>
                </div>

                {/* Tabbed Panels for Info */}
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
