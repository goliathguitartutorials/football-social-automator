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
        // FIX: Defensively ensure events is an array to prevent crashes.
        const safeEvents = Array.isArray(events) ? events : [];

        if (!liveMatch) {
            return { minute: 0, display: "00:00" };
        }

        const startEvent = safeEvents.find(e => e.eventType === 'MATCH_START');
        const matchStartTime = startEvent 
            ? new Date(startEvent.timestamp) 
            : new Date(`${liveMatch.matchDate}T${liveMatch.matchTime}`);

        const hasEnded = safeEvents.some(e => e.eventType === 'MATCH_END');
        if (hasEnded) {
            return { minute: 90, display: "Finished" };
        }

        const secondHalfStartEvent = safeEvents.find(e => e.eventType === 'SECOND_HALF_START');
        const secondHalfStartTime = secondHalfStartEvent ? new Date(secondHalfStartEvent.timestamp) : null;
        
        const isHalfTime = safeEvents.some(e => e.eventType === 'HALF_TIME') && !secondHalfStartTime;
        if (isHalfTime) {
            return { minute: 45, display: "HT" };
        }

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
        
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { minute: minutes, display };

    }, [liveMatch, events]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const newTime = calculateElapsedTime();
            setElapsedTime(newTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateElapsedTime]);

    return elapsedTime;
}
