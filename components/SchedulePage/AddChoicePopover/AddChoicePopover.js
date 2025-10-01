/*
 * ==========================================================
 * COMPONENT: AddChoicePopover
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/AddChoicePopover/AddChoicePopover.js
 * ==========================================================
 */
'use client';
import styles from './AddChoicePopover.module.css';
import { FootballPitchIcon } from '../../Navigation/Icons'; // MODIFIED: Corrected import path and icon name
import { CalendarIcon } from '../SchedulePageIcons';

export default function AddChoicePopover({ onChoice, onDismiss }) {
    return (
        <div className={styles.overlay} onClick={onDismiss}>
            <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                <h3>What would you like to schedule?</h3>
                <div className={styles.buttonGroup}>
                    <button onClick={() => onChoice('post')}>
                        <CalendarIcon />
                        <span>Schedule a Post</span>
                    </button>
                    <button onClick={() => onChoice('match')}>
                        <FootballPitchIcon /> {/* MODIFIED: Use the new icon component */}
                        <span>Schedule a Match</span>
                    </button>
                </div>
                <button className={styles.closeButton} onClick={onDismiss}>×</button>
            </div>
        </div>
    );
}
