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
import { OverviewIcon, SquadIcon, GoalIcon, YellowCardIcon, RedCardIcon, SubIcon, PlayIcon, PauseIcon, StopIcon } from './LiveTabIcons';
import CountdownTimer from './CountdownTimer';
import EventForm from './EventForm/EventForm';
import MatchEventsPanel from './MatchEventsPanel/MatchEventsPanel';
import SquadPanel from './SquadPanel/SquadPanel';

export default function LiveTab() {
    const { appData, authKey } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);
    const [view, setView] = useState('dashboard');
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [prepopulatedMinute, setPrepopulatedMinute] = useState('');
    const [events, setEvents] = useState([]);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [elapsedTimeDisplay, setElapsedTimeDisplay] = useState("00:00");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    
    const [matchStartTime, setMatchStartTime] = useState(null);
    const [secondHalfStartTime, setSecondHalfStartTime] = useState(null);

    const reconstructStateFromEvents = useCallback((eventList) => {
        if (!Array.isArray(eventList)) {
            setEvents([]);
            return;
        }
        const sortedEvents = eventList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setEvents(sortedEvents);

        const startEvent = sortedEvents.find(e => e.eventType === 'MATCH_START');
        if (startEvent && startEvent.timestamp) setMatchStartTime(new Date(startEvent.timestamp));

        const secondHalfEvent = sortedEvents.find(e => e.eventType === 'SECOND_HALF_START');
        if (secondHalfEvent && secondHalfEvent.timestamp) setSecondHalfStartTime(new Date(secondHalfEvent.timestamp));

        const newHomeScore = sortedEvents.filter(e => e.eventType === 'Goal' && e.team === 'home').length;
        const newAwayScore = sortedEvents.filter(e => e.eventType === 'Goal' && e.team === 'away').length;
        setScore({ home: newHomeScore, away: newAwayScore });
    }, []);

    useEffect(() => {
        const findAndLoadMatch = async () => {
            const now = new Date();
            const liveMatchWindowMs = 200 * 60 * 1000;
            if (!appData.matches || appData.matches.length === 0) {
                 setLiveMatch(null);
                 setNextMatch(null);
                 return;
            }

            const foundLiveMatch = appData.matches.find(match => {
                const matchScheduledTime = new Date(`${match.matchDate} ${match.matchTime}`);
                const matchEndTime = new Date(matchScheduledTime.getTime() + liveMatchWindowMs);
                return now >= matchScheduledTime && now <= matchEndTime;
            });

            if (foundLiveMatch) {
                if (liveMatch && foundLiveMatch.matchId === liveMatch.matchId) return;

                setApiError('');
                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const processedMatch = {
                    ...foundLiveMatch, homeTeamName, awayTeamName,
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                };
                setLiveMatch(processedMatch);

                try {
                    const response = await fetch('/api/manage-match', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                        body: JSON.stringify({ action: 'get_match_events', matchData: { matchId: foundLiveMatch.matchId } })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch existing match events.');
                    }
                    
                    const result = await response.json();
                    const existingEvents = result.data || result || [];
                    
                    if (Array.isArray(existingEvents) && existingEvents.length > 0) {
                        reconstructStateFromEvents(existingEvents);
                    } else {
                        setEvents([]);
                        setScore({ home: 0, away: 0});
                        setMatchStartTime(null);
                        setSecondHalfStartTime(null);
                    }
                } catch (error) {
                    setApiError(error.message);
                }

            } else {
                setLiveMatch(null);
                const upcomingMatches = appData.matches.filter(match => new Date(`${match.matchDate} ${match.matchTime}`) > now);
                setNextMatch(upcomingMatches[0] || null);
            }
        };
        findAndLoadMatch();
    }, [appData.matches, authKey, reconstructStateFromEvents, liveMatch]);

    const calculateElapsedTime = useCallback(() => {
        if (!matchStartTime) return { minute: 0, display: "Not Started" };

        // MODIFIED: Removed 'AUTO_MATCH_END' from this check
        const hasEnded = events.some(e => e.eventType === 'MATCH_END');
        if (hasEnded) return { minute: 90, display: "Finished" };
        
        const isHalfTime = events.some(e => e.eventType === 'HALF_TIME') && !events.some(e => e.eventType === 'SECOND_HALF_START');
        if(isHalfTime) return { minute: 45, display: "HT" };

        const now = new Date();
        let totalSeconds;

        if (secondHalfStartTime && now > secondHalfStartTime) {
            const firstHalfDurationSeconds = (secondHalfStartTime - matchStartTime) / 1000 - (15 * 60);
            const secondHalfSeconds = (now - secondHalfStartTime) / 1000;
            totalSeconds = firstHalfDurationSeconds + secondHalfSeconds;
        } else {
            totalSeconds = (now - matchStartTime) / 1000;
        }
        
        if (totalSeconds < 0) return { minute: 0, display: "00:00" };

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: minutes + 1, display };
    }, [matchStartTime, secondHalfStartTime, events]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const { display } = calculateElapsedTime();
            setElapsedTimeDisplay(display);
        }, 1000);
        return () => clearInterval(interval);
    }, [calculateElapsedTime]);

    const handleEventClick = (eventType) => {
        const { minute } = calculateElapsedTime();
        setPrepopulatedMinute(minute);
        setSelectedEventType(eventType);
        setView('logEvent');
        setApiError('');
    };
    
    const handleControlClick = async (eventType) => {
        await handleEventSubmit({ eventType, minute: calculateElapsedTime().minute });
    };

    const handleFormCancel = () => {
        setView('dashboard');
        setSelectedEventType(null);
    };

    const handleEventSubmit = async (eventData) => {
        setIsSubmitting(true);
        setApiError('');

        const eventTimestamp = (eventData.eventType === 'MATCH_START' && eventData.startTime) ? new Date(eventData.startTime) : new Date();
        const eventId = `event_${eventTimestamp.getTime()}`;
        
        const apiPayload = {
            eventId, matchId: liveMatch.matchId, eventType: eventData.eventType,
            minute: eventData.minute, timestamp: eventTimestamp.toISOString(), team: eventData.team || '',
            playerFullName: eventData.scorer || eventData.player || eventData.playerOff || '',
            assistByFullName: eventData.assist || eventData.playerOn || '',
        };

        try {
            const response = await fetch('/api/manage-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify({ action: 'log_event', matchData: apiPayload })
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to log event.');
            
            const refetchResponse = await fetch('/api/manage-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify({ action: 'get_match_events', matchData: { matchId: liveMatch.matchId } })
            });
            if (!refetchResponse.ok) throw new Error((await refetchResponse.json()).error || 'Failed to refetch events.');
            
            const result = await refetchResponse.json();
            reconstructStateFromEvents(result.data || result || []);
            
            handleFormCancel();
        } catch (error) {
            setApiError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // MODIFIED: The entire useEffect hook for auto-ending the match has been removed.

    if (view === 'logEvent') {
        return <EventForm eventType={selectedEventType} match={liveMatch} onCancel={handleFormCancel} onSubmit={handleEventSubmit} initialMinute={prepopulatedMinute} isSubmitting={isSubmitting} apiError={apiError} />;
    }

    if (liveMatch) {
        const hasStarted = events.some(e => e.eventType === 'MATCH_START');
        const isHalfTime = events.some(e => e.eventType === 'HALF_TIME') && !events.some(e => e.eventType === 'SECOND_HALF_START');
        const hasSecondHalfStarted = events.some(e => e.eventType === 'SECOND_HALF_START');
        // MODIFIED: Removed 'AUTO_MATCH_END' from this check
        const hasEnded = events.some(e => e.eventType === 'MATCH_END');

        return (
            <div className={styles.dashboardContainer}>
                {apiError && <p className={styles.apiErrorBar}>{apiError}</p>}
                <div className={styles.matchHeader}>
                    <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                    <div className={styles.scoreContainer}>
                        <span className={styles.score}>{score.home} - {score.away}</span>
                        <span className={styles.elapsedTime}>{elapsedTimeDisplay}</span>
                    </div>
                    <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                </div>

                <div className={styles.controlsSection}>
                    {!hasEnded && (
                        <div className={styles.matchControls}>
                            {!hasStarted && <button className={styles.controlButton} onClick={() => handleEventClick('MATCH_START')}><PlayIcon/>Start Match</button>}
                            {hasStarted && !isHalfTime && <button className={styles.controlButton} onClick={() => handleControlClick('HALF_TIME')}><PauseIcon/>Half-Time</button>}
                            {isHalfTime && !hasSecondHalfStarted && <button className={styles.controlButton} onClick={() => handleControlClick('SECOND_HALF_START')}><PlayIcon/>Start 2nd Half</button>}
                            {hasStarted && <button className={styles.controlButton} onClick={() => handleControlClick('MATCH_END')}><StopIcon/>Finish Match</button>}
                        </div>
                    )}
                     <div className={styles.eventGrid}>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Goal')} disabled={!hasStarted || hasEnded}><GoalIcon /><span>Goal</span></button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')} disabled={!hasStarted || hasEnded}><YellowCardIcon /><span>Yellow Card</span></button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')} disabled={!hasStarted || hasEnded}><RedCardIcon /><span>Red Card</span></button>
                        <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')} disabled={!hasStarted || hasEnded}><SubIcon /><span>Substitution</span></button>
                    </div>
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
