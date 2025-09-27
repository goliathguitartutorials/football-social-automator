/*
 * ==========================================================
 * COMPONENT: EventForm
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/EventForm/EventForm.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import styles from './EventForm.module.css';

export default function EventForm({ eventType, match, onCancel, onSubmit, initialMinute }) {
    const [minute, setMinute] = useState(initialMinute || '');
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [assistPlayer, setAssistPlayer] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventData = {
            matchId: match.matchId,
            eventType,
            minute,
            // Conditionally add player/scorer/assist data
            ...( (eventType.includes('Card') || eventType === 'Substitution') && { player: selectedPlayer }),
            ...( eventType === 'Goal' && { scorer: selectedPlayer, assist: assistPlayer }),
        };
        onSubmit(eventData);
    };

    const renderFormContent = () => {
        switch (eventType) {
            case 'Goal':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label htmlFor="scorer">Scorer</label>
                            <select id="scorer" value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} required>
                                <option value="" disabled>Select player...</option>
                                {match.squadList.map(player => <option key={player} value={player}>{player}</option>)}
                                <option value="Own Goal">Own Goal</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="assist">Assist By</label>
                            <select id="assist" value={assistPlayer} onChange={(e) => setAssistPlayer(e.target.value)}>
                                <option value="">None</option>
                                {match.squadList.map(player => <option key={player} value={player}>{player}</option>)}
                            </select>
                        </div>
                    </>
                );
            case 'Yellow Card':
            case 'Red Card':
                return (
                    <div className={styles.formGroup}>
                        <label htmlFor="player">Player</label>
                        <select id="player" value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} required>
                            <option value="" disabled>Select player...</option>
                            {match.squadList.map(player => <option key={player} value={player}>{player}</option>)}
                        </select>
                    </div>
                );
            // TODO: Add case for 'Substitution'
            default:
                return <p>Form not implemented for this event type.</p>;
        }
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}>
                <h3>Log: {eventType}</h3>
            </header>
            <form onSubmit={handleSubmit} className={styles.formBody}>
                {renderFormContent()}
                <div className={styles.formGroup}>
                    <label htmlFor="minute">Minute</label>
                    <input
                        id="minute"
                        type="number"
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        placeholder="e.g., 42"
                        required
                        min="1"
                    />
                </div>
                <div className={styles.formFooter}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={styles.submitButton}>Log Event</button>
                </div>
            </form>
        </div>
    );
}
