/*
 * ==========================================================
 * COMPONENT: EventModal
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/EventModal/EventModal.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import styles from './EventModal.module.css';

export default function EventModal({ eventType, match, onClose, onSubmit }) {
    const [minute, setMinute] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [assistPlayer, setAssistPlayer] = useState('');

    // For goals, determine which team is ours
    const ourTeamName = match.homeOrAway === 'Home' ? match.homeTeamName : match.awayTeamName;

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventData = {
            matchId: match.matchId,
            eventType,
            minute,
            player: selectedPlayer,
            // Add more data as needed
            ...(eventType === 'Goal' && { scorer: selectedPlayer, assist: assistPlayer }),
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
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Log: {eventType}</h3>
                    <button onClick={onClose} className={styles.closeButton}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalBody}>
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
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Log Event</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
