/*
 * ==========================================================
 * COMPONENT: LivePage (Debugging Step 3: Add Events Panel)
 * PAGE: Live
 * FILE: /components/LivePage/LivePage.js
 * ==========================================================
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LivePage.module.css';
import CountdownTimer from './CountdownTimer';
// STEP 3: Re-introduce necessary imports
import { OverviewIcon, SquadIcon } from '@/components/LivePage/LivePageIcons';
import MatchEventsPanel from './MatchEventsPanel/MatchEventsPanel';
import SquadPanel from './SquadPanel/SquadPanel';


export default function LivePage() {
    const { appData, authKey } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);
    const [events, setEvents] = useState([]);
    // STEP 3: Re-introduce activeTab state
    const [activeTab, setActiveTab] = useState('overview');

    const reconstructStateFromEvents = useCallback((eventList) => {
        const safeEvents = Array.isArray(eventList) ? eventList : [];
        const sortedEvents = safeEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setEvents(sortedEvents);
    }, []);


    useEffect(() => {
        const findAndLoadMatch = async () => {
            if (!appData.matches || appData.matches.length === 0) {
                setLiveMatch(null);
                setNextMatch(null);
                return;
            }

            const now = new Date();
            const liveMatchWindowMs = 120 * 60 * 1000;

            const foundLiveMatch = appData.matches.find(match => {
                const matchScheduledTime = new Date(`${match.matchDate}T${match.matchTime}`);
                const matchEndTime = new Date(matchScheduledTime.getTime() + liveMatchWindowMs);
                return now >= matchScheduledTime && now <= matchEndTime;
            });

            if (foundLiveMatch) {
                if (liveMatch && foundLiveMatch.matchId === liveMatch.matchId) return;

                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const processedMatch = { 
                    ...foundLiveMatch, 
                    homeTeamName, 
                    awayTeamName,
                    squadList: foundLiveMatch.squad ? foundLiveMatch.squad.split(',').map(name => name.trim()) : []
                };

                setLiveMatch(processedMatch);

                try {
                    const response = await fetch('/api/manage-match', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                        body: JSON.stringify({ action: 'get_match_events', matchData: { matchId: foundLiveMatch.matchId } })
                    });
                    
                    if (!response.ok) throw new Error('API call for events failed.');
                    
                    const result = await response.json();
                    const existingEvents = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
                    
                    reconstructStateFromEvents(existingEvents);
                    
                } catch (error) {
                    console.error("DIAGNOSTIC: Error fetching events:", error);
                    reconstructStateFromEvents([]);
                }

            } else {
                if(liveMatch) setLiveMatch(null);
                
                const upcomingMatches = appData.matches
                    .filter(match => {
                        const matchScheduledTime = new Date(`${match.matchDate}T${match.matchTime}`);
                        return matchScheduledTime > now;
                    })
                    .sort((a, b) => new Date(`${a.matchDate}T${a.matchTime}`) - new Date(`${b.matchDate}T${b.matchTime}`));

                setNextMatch(upcomingMatches[0] || null);
            }
        };

        findAndLoadMatch();
        const intervalId = setInterval(findAndLoadMatch, 30000);
        return () => clearInterval(intervalId);

    }, [appData.matches, authKey, liveMatch, reconstructStateFromEvents]);


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

                {/* STEP 3: Re-introduce the details container and tabs */}
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

    return (
        <div className={styles.placeholder}>
            <h3>No Match Currently In Progress</h3>
            <p>Check the schedule for upcoming matches.</p>
        </div>
    );
}
