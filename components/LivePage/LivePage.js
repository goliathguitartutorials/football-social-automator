/*
 * ==========================================================
 * COMPONENT: LivePage (Debugging Step 2: Fetch Events)
 * PAGE: Live
 * FILE: /components/LivePage/LivePage.js
 * ==========================================================
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './LivePage.module.css';
import CountdownTimer from './CountdownTimer';

export default function LivePage() {
    const { appData, authKey } = useAppContext();
    const [liveMatch, setLiveMatch] = useState(null);
    const [nextMatch, setNextMatch] = useState(null);
    
    // STEP 2: Re-introduce the 'events' state
    const [events, setEvents] = useState([]);

    // STEP 2: Re-introduce a simple function to set events state
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
                // Prevent re-fetching if the match is already loaded
                if (liveMatch && foundLiveMatch.matchId === liveMatch.matchId) return;

                const homeTeamName = foundLiveMatch.homeOrAway === 'Home' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const awayTeamName = foundLiveMatch.homeOrAway === 'Away' ? 'CPD Y Glannau' : foundLiveMatch.opponent;
                const processedMatch = { ...foundLiveMatch, homeTeamName, awayTeamName };

                setLiveMatch(processedMatch);

                // STEP 2: Re-introduce the API call to fetch events
                try {
                    console.log(`DIAGNOSTIC: Fetching events for matchId: ${foundLiveMatch.matchId}`);
                    const response = await fetch('/api/manage-match', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                        body: JSON.stringify({ action: 'get_match_events', matchData: { matchId: foundLiveMatch.matchId } })
                    });
                    
                    if (!response.ok) throw new Error('API call for events failed.');
                    
                    const result = await response.json();
                    const existingEvents = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
                    
                    console.log("DIAGNOSTIC: Fetched events from API ->", existingEvents);
                    reconstructStateFromEvents(existingEvents);
                    
                } catch (error) {
                    console.error("DIAGNOSTIC: Error fetching events:", error);
                    reconstructStateFromEvents([]); // Set to empty array on error
                }

            } else {
                if(liveMatch) setLiveMatch(null); // Clear live match if window has passed
                
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
