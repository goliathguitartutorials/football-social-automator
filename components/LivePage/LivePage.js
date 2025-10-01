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
import { OverviewIcon, SquadIcon } from '@/components/LivePage/LivePageIcons';
import { useMatchTimer } from './hooks/useMatchTimer';
import MatchHeader from './MatchHeader/MatchHeader'; // REFACTORED: Import new component
import MatchControls from './MatchControls/MatchControls'; // REFACTORED: Import new component
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    
    const { minute: currentMinute, display: elapsedTimeDisplay } = useMatchTimer(liveMatch, events);

    const reconstructStateFromEvents = useCallback((eventList) => {
        const safeEvents = Array.isArray(eventList) ? eventList : [];
        const sortedEvents = safeEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setEvents(sortedEvents);

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
                    const existingEvents = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
                    
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

    const handleEventClick = (eventType) => {
        setPrepopulatedMinute(String(currentMinute));
        setSelectedEventType(eventType);
        setView('logEvent');
        setApiError('');
    };
    
    const handleControlClick = async (eventType, extraData = {}) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setApiError('');
        try {
            await handleEventSubmit({ eventType, minute: currentMinute, ...extraData });
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
            const freshEvents = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

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

        const matchState = {
            isHalfTime: events.some(e => e.eventType === 'HALF_TIME') && !events.some(e => e.eventType === 'SECOND_HALF_START'),
            hasSecondHalfStarted: events.some(e => e.eventType === 'SECOND_HALF_START'),
            hasEnded: events.some(e => e.eventType === 'MATCH_END')
        };

        if (matchState.hasEnded) {
            return (
                <>
                    <MatchHeader
                        homeTeam={liveMatch.homeTeamName}
                        awayTeam={liveMatch.awayTeamName}
                        score={score}
                        time={"Match Finished"}
                    />
                    <div className={styles.preGameContainer}>
                        <p>You can now archive this match. This will remove it from the Fixtures and Live tabs.</p>
                        <div className={styles.preGameButtons}>
                            <button className={styles.controlButton} onClick={manuallyArchiveMatch} disabled={isSubmitting}>
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
            );
        }

        return (
            <>
                <MatchHeader
                    homeTeam={liveMatch.homeTeamName}
                    awayTeam={liveMatch.awayTeamName}
                    score={score}
                    time={elapsedTimeDisplay}
                />
                
                <MatchControls
                    isSubmitting={isSubmitting}
                    matchState={matchState}
                    onControlClick={handleControlClick}
                    onEventClick={handleEventClick}
                />

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
