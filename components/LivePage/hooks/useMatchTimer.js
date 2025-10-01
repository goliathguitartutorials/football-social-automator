/*
 * ==========================================================
 * HOOK: useMatchTimer
 * COMPONENT: LivePage
 * FILE: /components/LivePage/hooks/useMatchTimer.js
 * ==========================================================
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMatchTimer(liveMatch, events) {
    const [elapsedTime, setElapsedTime] = useState({ minute: 0, display: "00:00" });

    const calculateElapsedTime = useCallback(() => {
        // A match must be live to calculate time.
        if (!liveMatch) {
            return { minute: 0, display: "00:00" };
        }

        // Determine the definitive start time. Default to schedule, override with event.
        const startEvent = events.find(e => e.eventType === 'MATCH_START');
        const matchStartTime = startEvent 
            ? new Date(startEvent.timestamp) 
            : new Date(`${liveMatch.matchDate}T${liveMatch.matchTime}`);

        // Check for terminal and intermediate match states
        const hasEnded = events.some(e => e.eventType === 'MATCH_END');
        if (hasEnded) {
            return { minute: 90, display: "Finished" };
        }

        const secondHalfStartEvent = events.find(e => e.eventType === 'SECOND_HALF_START');
        const secondHalfStartTime = secondHalfStartEvent ? new Date(secondHalfStartEvent.timestamp) : null;
        
        const isHalfTime = events.some(e => e.eventType === 'HALF_TIME') && !secondHalfStartTime;
        if (isHalfTime) {
            return { minute: 45, display: "HT" };
        }

        // Calculate elapsed seconds based on the current phase of the match
        const now = new Date();
        let totalSeconds;

        if (secondHalfStartTime && now >= secondHalfStartTime) {
            const firstHalfDurationSeconds = 45 * 60;
            const secondHalfSeconds = (now - secondHalfStartTime) / 1000;
            totalSeconds = firstHalfDurationSeconds + secondHalfSeconds;
        } else {
            totalSeconds = (now - matchStartTime) / 1000;
        }
        
        if (totalSeconds < 0) {
            return { minute: 0, display: "00:00" };
        }

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        // Format the display string
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: minutes, display };

    }, [liveMatch, events]);
    
    // This effect runs the timer, updating the elapsed time every second.
    useEffect(() => {
        const interval = setInterval(() => {
            const newTime = calculateElapsedTime();
            setElapsedTime(newTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateElapsedTime]);

    return elapsedTime;
}
