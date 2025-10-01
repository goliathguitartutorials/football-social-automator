/*
 * ==========================================================
 * COMPONENT: LivePage
 * PAGE: Live
 * FILE: /components/LivePage/LivePage.js
 * ==========================================================
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LivePage.module.css';
import { OverviewIcon, SquadIcon, GoalIcon, YellowCardIcon, RedCardIcon, SubIcon, PlayIcon, PauseIcon, StopIcon } from '@/components/LivePage/LivePageIcons';
import CountdownTimer from './CountdownTimer';
import EventForm from './EventForm/EventForm';
import MatchEventsPanel from './MatchEventsPanel/MatchEventsPanel';
import SquadPanel from './SquadPanel/SquadPanel';

export default function LivePage() {
    const { appData, authKey, refreshAppData } = useAppContext();
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
    
    // REFACTORED: Removed dedicated matchStartTime state. It will now be derived.
    const [secondHalfStartTime, setSecondHalfStartTime] = useState(null);

    const reconstructStateFromEvents = useCallback((eventList) => {
        if (!Array.isArray(eventList)) {
            setEvents([]);
            return;
        }
        const sortedEvents = eventList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setEvents(sortedEvents);

        const secondHalfEvent = sortedEvents.find(e => e.eventType === 'SECOND_HALF_START');
        if (secondHalfEvent && secondHalfEvent.timestamp) setSecondHalfStartTime(new Date(secondHalfEvent.timestamp));

        const newHomeScore = sortedEvents.filter(e => e.eventType === 'Goal' && e.team === 'home').length;
        const newAwayScore = sortedEvents.filter(e => e.eventType === 'Goal' && e.team === 'away').length;
        setScore({ home: newHomeScore, away: newAwayScore });
    }, []);

    useEffect(() => {
        try {
            const savedState = sessionStorage.getItem('liveMatchState');
            if (savedState) {
                const { match, events: savedEvents } = JSON.parse(savedState);
                if (match && Array.isArray(savedEvents)) {
                    setLiveMatch(match);
                    reconstructStateFromEvents(savedEvents);
                }
            }
        } catch (error) {
            console.error("Failed to parse live match state from session storage:", error);
            sessionStorage.removeItem('liveMatchState');
        }
    }, [reconstructStateFromEvents]);

    const handleArchiveMatch = useCallback(async (matchToArchive) => {
        if (isSubmitting || !matchToArchive) return;
        setIsSubmitting(true);
        setApiError('');
        try {
            const response = await fetch('/api/manage-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify({ 
                    action: 'archive_match', 
                    matchData: { 
                        matchId: matchToArchive.matchId,
                        homeScore: matchToArchive.homeScore || 0,
                        awayScore: matchToArchive.awayScore || 0
                    } 
                })
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to archive match.');
            
            if (liveMatch && liveMatch.matchId === matchToArchive.matchId) {
                sessionStorage.removeItem('liveMatchState');
                setLiveMatch(null);
            }
            await refreshAppData();
    
        } catch(error) {
            setApiError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [authKey, refreshAppData, isSubmitting, liveMatch]);

    useEffect(() => {
        const findAndLoadMatch = async () => {
            const now = new Date();
            const liveMatchWindowMs = 120 * 60 * 1000;
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                setNextMatch(null);
                return;
            }

            const matchToArchive = appData.matches.find(match => {
                const matchKickOffTime = new Date(`${match.matchDate}T${match.matchTime}`);
                const matchEndTime = new Date(matchKickOffTime.getTime() + liveMatchWindowMs);
                return now > matchEndTime && match.status !== 'archived';
            });

            if (matchToArchive) {
                handleArchiveMatch({
                    matchId: matchToArchive.matchId,
                    homeScore: matchToArchive.homeScore,
                    awayScore: matchToArchive.awayScore
                });
                return; 
            }
            
            const foundLiveMatch = appData.matches.find(match => {
                const matchScheduledTime = new Date(`${match.matchDate}T${match.matchTime}`);
                const matchEndTime = new Date(matchScheduledTime.getTime() + liveMatchWindowMs);
                return now >= matchScheduledTime && now <= matchEndTime && match.status !== 'archived';
            });

            if (foundLiveMatch) {
                if (liveMatch && foundLiveMatch.matchId === liveMatch.matchId) return;

                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const processedMatch = {
                    ...foundLiveMatch, homeTeamName, awayTeamName,
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                };

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
                    
                    // REFACTORED: Set state together to prevent race conditions.
                    setLiveMatch(processedMatch);
                    reconstructStateFromEvents(existingEvents);
                    
                    sessionStorage.setItem('liveMatchState', JSON.stringify({ match: processedMatch, events: existingEvents }));
                    
                } catch (error) {
                    setApiError(error.message);
                }

            } else {
                if(liveMatch) {
                    setLiveMatch(null);
                    sessionStorage.removeItem('liveMatchState');
                }
                const upcomingMatches = appData.matches
                    .filter(match => new Date(`${match.matchDate}T${match.matchTime}`) > now && match.status !== 'archived')
                    .sort((a, b) => new Date(`${a.matchDate}T${a.matchTime}`) - new Date(`${b.matchDate}T${b.matchTime}`));
                setNextMatch(upcomingMatches[0] || null);
            }
        };

        findAndLoadMatch(); 
        
        if (!liveMatch) {
            const intervalId = setInterval(findAndLoadMatch, 30000); 
            return () => clearInterval(intervalId);
        }

    }, [appData.matches, authKey, reconstructStateFromEvents, liveMatch, handleArchiveMatch]);

    const calculateElapsedTime = useCallback(() => {
        // --- REFACTORED LOGIC ---
        // 1. A match must be live to calculate time.
        if (!liveMatch) return { minute: 0, display: "00:00" };

        // 2. Determine the definitive start time. Default to schedule.
        const startEvent = events.find(e => e.eventType === 'MATCH_START');
        const matchStartTime = startEvent ? new Date(startEvent.timestamp) : new Date(`${liveMatch.matchDate}T${liveMatch.matchTime}`);
        
        const hasEnded = events.some(e => e.eventType === 'MATCH_END');
        if (hasEnded) return { minute: 90, display: "Finished" };
        
        const isHalfTime = events.some(e => e.eventType === 'HALF_TIME') && !events.some(e => e.eventType === 'SECOND_HALF_START');
        if(isHalfTime) return { minute: 45, display: "HT" };

        const now = new Date();
        let totalSeconds;

        if (secondHalfStartTime && now >= secondHalfStartTime) {
            const firstHalfDurationSeconds = 45 * 60;
            const secondHalfSeconds = (now - secondHalfStartTime) / 1000;
            totalSeconds = firstHalfDurationSeconds + secondHalfSeconds;
        } else {
            totalSeconds = (now - matchStartTime) / 1000;
        }
        
        if (totalSeconds < 0) return { minute: 0, display: "00:00" };

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: minutes, display };
    }, [liveMatch, events, secondHalfStartTime]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const { display } = calculateElapsedTime();
            setElapsedTimeDisplay(display);
        }, 1000);
        return () => clearInterval(interval);
    }, [calculateElapsedTime]);

    const handleEventClick = (eventType) => {
        const { minute } = calculateElapsedTime();
        setPrepopulatedMinute(String(minute));
        setSelectedEventType(eventType);
        setView('logEvent');
        setApiError('');
    };
    
    const handleControlClick = async (eventType, extraData = {}) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setApiError('');
        try {
            const { minute } = calculateElapsedTime();
            await handleEventSubmit({ eventType, minute, ...extraData });
        } catch (error) {
            setApiError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormCancel = () => {
        setView('dashboard');
        setSelectedEventType(null);
    };

    const handleEventSubmit = async (eventData) => {
        setIsSubmitting(true);
        setApiError('');

        const eventTimestamp = (eventData.startTime) ? new Date(eventData.startTime) : new Date();
        const eventId = `event_${eventTimestamp.getTime()}`;
        
        // REFACTORED: No longer need to set matchStartTime here.
        if (eventData.eventType === 'SECOND_HALF_START') setSecondHalfStartTime(eventTimestamp);
        
        const apiPayload = {
            eventId, matchId: liveMatch.matchId, eventType: eventData.eventType,
            minute: eventData.minute, timestamp: eventTimestamp.toISOString(), team: eventData.team,
            playerFullName: eventData.scorer || eventData.player || eventData.playerOff,
            assistByFullName: eventData.assist || eventData.playerOn,
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
            const freshEvents = result.data || result || [];

            reconstructStateFromEvents(freshEvents);
            
            if (freshEvents.some(e => e.eventType === 'MATCH_END')) {
                sessionStorage.removeItem('liveMatchState');
            } else {
                sessionStorage.setItem('liveMatchState', JSON.stringify({ match: liveMatch, events: freshEvents }));
            }

            handleFormCancel();
        } catch (error) {
            setApiError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const manuallyArchiveMatch = () => {
        handleArchiveMatch({
            matchId: liveMatch.matchId,
            homeScore: score.home,
            awayScore: score.away,
        });
    };
    
    const renderContent = () => {
        if (!liveMatch) return null;

        const isHalfTime = events.some(e => e.eventType === 'HALF_TIME') && !events.some(e => e.eventType === 'SECOND_HALF_START');
        const hasSecondHalfStarted = events.some(e => e.eventType === 'SECOND_HALF_START');
        const hasEnded = events.some(e => e.eventType === 'MATCH_END');

        if (hasEnded) {
            return (
                <>
                    <div className={styles.matchHeader}>
                        <span className={styles.teamName}>{liveMatch.homeTeamName}</span>
                        <div className={styles.scoreContainer}>
                            <span className={styles.score}>{score.home} - {score.away}</span>
                            <span className={styles.elapsedTime}>Match Finished</span>
                        </div>
                        <span className={styles.teamName}>{liveMatch.awayTeamName}</span>
                    </div>
                    <div className={styles.preGameContainer}>
                        <p>You can now archive this match. This will remove it from the Fixtures and Live tabs.</p>
                        <div className={styles.preGameButtons}>
                            <button 
                                className={styles.controlButton} 
                                onClick={manuallyArchiveMatch}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Archiving...' : 'Archive Match'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailsContainer}>
                        <div className={styles.panelContainer}>
                            <MatchEventsPanel events={events} match={liveMatch} />
                        </div>
                    </div>
                </>
            )
        }

        return (
            <>
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
                            {!isHalfTime && <button className={styles.controlButton} onClick={() => handleControlClick('HALF_TIME')} disabled={isSubmitting}>{isSubmitting ? 'Logging...' : <><PauseIcon/>Half-Time</>}</button>}
                            {isHalfTime && !hasSecondHalfStarted && <button className={styles.controlButton} onClick={() => handleControlClick('SECOND_HALF_START')} disabled={isSubmitting}>{isSubmitting ? 'Starting...' : <><PlayIcon/>Start 2nd Half</>}</button>}
                            {!hasEnded && <button className={styles.controlButton} onClick={() => handleControlClick('MATCH_END')} disabled={isSubmitting}>{isSubmitting ? 'Finishing...' : <><StopIcon/>Finish Match</>}</button>}
                        </div>
                    )}
                     <div className={styles.eventGrid}>
                          <button className={styles.eventButton} onClick={() => handleEventClick('Goal')} disabled={hasEnded}><GoalIcon /><span>Goal</span></button>
                          <button className={styles.eventButton} onClick={() => handleEventClick('Yellow Card')} disabled={hasEnded}><YellowCardIcon /><span>Yellow Card</span></button>
                          <button className={styles.eventButton} onClick={() => handleEventClick('Red Card')} disabled={hasEnded}><RedCardIcon /><span>Red Card</span></button>
                          <button className={styles.eventButton} onClick={() => handleEventClick('Substitution')} disabled={hasEnded}><SubIcon /><span>Substitution</span></button>
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
            </>
        );
    };
    
    if (view === 'logEvent') {
        return <EventForm eventType={selectedEventType} match={liveMatch} onCancel={handleFormCancel} onSubmit={handleEventSubmit} initialMinute={prepopulatedMinute} isSubmitting={isSubmitting} apiError={apiError} />;
    }

    if (liveMatch) {
        return (
            <div className={styles.dashboardContainer}>
                {apiError && <p className={styles.apiErrorBar}>{apiError}</p>}
                {renderContent()}
            </div>
        );
    }
    
    if (nextMatch) {
        const targetDate = `${nextMatch.matchDate}T${nextMatch.matchTime}`;
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
            <p>When a match is live, this page will activate to allow real-time event logging.</p>
        </div>
    );
}
