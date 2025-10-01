/*
 * ==========================================================
 * COMPONENT: MatchHeader
 * PAGE: Live
 * FILE: /components/LivePage/MatchHeader/MatchHeader.js
 * ==========================================================
 */
import React from 'react';
import styles from '../LivePage.module.css';

export default function MatchHeader({ homeTeam, awayTeam, score, time }) {
    return (
        <div className={styles.matchHeader}>
            <span className={styles.teamName}>{homeTeam}</span>
            <div className={styles.scoreContainer}>
                <span className={styles.score}>{score.home} - {score.away}</span>
                <span className={styles.elapsedTime}>{time}</span>
            </div>
            <span className={styles.teamName}>{awayTeam}</span>
        </div>
    );
}
