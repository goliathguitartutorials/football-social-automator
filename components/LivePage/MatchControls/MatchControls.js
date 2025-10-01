/*
 * ==========================================================
 * COMPONENT: MatchControls
 * PAGE: Live
 * FILE: /components/LivePage/MatchControls/MatchControls.js
 * ==========================================================
 */
import React from 'react';
import styles from '../LivePage.module.css';
import { GoalIcon, YellowCardIcon, RedCardIcon, SubIcon, PlayIcon, PauseIcon, StopIcon } from '@/components/LivePage/LivePageIcons';

export default function MatchControls({ isSubmitting, matchState, onControlClick, onEventClick }) {
    const { isHalfTime, hasSecondHalfStarted, hasEnded } = matchState;

    // Do not render any controls if the match has finished.
    if (hasEnded) {
        return null;
    }

    return (
        <div className={styles.controlsSection}>
            <div className={styles.matchControls}>
                {!isHalfTime && (
                    <button className={styles.controlButton} onClick={() => onControlClick('HALF_TIME')} disabled={isSubmitting}>
                        {isSubmitting ? 'Logging...' : <><PauseIcon/>Half-Time</>}
                    </button>
                )}
                {isHalfTime && !hasSecondHalfStarted && (
                    <button className={styles.controlButton} onClick={() => onControlClick('SECOND_HALF_START')} disabled={isSubmitting}>
                        {isSubmitting ? 'Starting...' : <><PlayIcon/>Start 2nd Half</>}
                    </button>
                )}
                {!hasEnded && (
                    <button className={styles.controlButton} onClick={() => onControlClick('MATCH_END')} disabled={isSubmitting}>
                        {isSubmitting ? 'Finishing...' : <><StopIcon/>Finish Match</>}
                    </button>
                )}
            </div>
            <div className={styles.eventGrid}>
                <button className={styles.eventButton} onClick={() => onEventClick('Goal')} disabled={hasEnded}>
                    <GoalIcon /><span>Goal</span>
                </button>
                <button className={styles.eventButton} onClick={() => onEventClick('Yellow Card')} disabled={hasEnded}>
                    <YellowCardIcon /><span>Yellow Card</span>
                </button>
                <button className={styles.eventButton} onClick={() => onEventClick('Red Card')} disabled={hasEnded}>
                    <RedCardIcon /><span>Red Card</span>
                </button>
                <button className={styles.eventButton} onClick={() => onEventClick('Substitution')} disabled={hasEnded}>
                    <SubIcon /><span>Substitution</span>
                </button>
            </div>
        </div>
    );
}
