/*
 * ==========================================================
 * COMPONENT: CountdownTimer
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/CountdownTimer.js
 * ==========================================================
 */
'use client';

import { useState, useEffect } from 'react';
import styles from './LiveTab.module.css';

export default function CountdownTimer({ targetDate }) {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        // Clear the interval on component unmount
        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && interval !== 'seconds' && timeLeft.days === 0 && (interval !== 'minutes' || timeLeft.hours === 0)) {
            // Don't push 0 values unless it's for seconds, or for minutes/hours when we are close to the event
            if (interval === 'minutes' && timeLeft.hours > 0) return;
            if (interval === 'hours' && timeLeft.days > 0) return;
            if(interval === 'days' && timeLeft.days === 0) return;
        }

        timerComponents.push(
            <div key={interval} className={styles.countdownBlock}>
                <span className={styles.countdownValue}>{String(timeLeft[interval]).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>{interval}</span>
            </div>
        );
    });

    return (
        <div className={styles.countdownContainer}>
            {timerComponents.length ? timerComponents : <span>Match is about to start!</span>}
        </div>
    );
}
