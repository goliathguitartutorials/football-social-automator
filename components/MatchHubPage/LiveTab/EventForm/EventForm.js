/*
 * ==========================================================
 * COMPONENT: EventForm
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/LiveTab/EventForm/EventForm.js
 * ==========================================================
 */
'use client';

import { useState, useEffect } from 'react';
import styles from './EventForm.module.css';

// MODIFIED: Added isSubmitting and apiError to props for user feedback
export default function EventForm({ eventType, match, onCancel, onSubmit, initialMinute, isSubmitting, apiError }) {
    const [minute, setMinute] = useState(initialMinute || '');
    const [team, setTeam] = useState('home'); // 'home' or 'away'
    const [player1, setPlayer1] = useState(''); // Used for scorer, carded player, sub off
    const [player2, setPlayer2] = useState(''); // Used for assist, sub on
    
    const ourTeamKey = match.homeOrAway === 'Home' ? 'home' : 'away';

    // Reset player fields if the selected team changes
    useEffect(() => {
        setPlayer1('');
        setPlayer2('');
    }, [team]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventData = {
            matchId: match.matchId, eventType, minute, team,
            ...(eventType === 'Goal' && { scorer: player1, assist: player2 }),
            ...(eventType.includes('Card') && { player: player1 }),
            ...(eventType === 'Substitution' && { playerOff: player1, playerOn: player2 }),
        };
        onSubmit(eventData);
    };

    const renderPlayerField = (label, value, setter, isRequired) => {
        // If the event is for the opposition, show a text input instead of a dropdown
        if (team !== ourTeamKey) {
            return (
                <div className={styles.formGroup}>
                    <label htmlFor={label.toLowerCase().replace(' ', '')}>{label} (Optional)</label>
                    <input
                        type="text"
                        id={label.toLowerCase().replace(' ', '')}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="Enter player name if known"
                    />
                </div>
            );
        }
        // Otherwise, show the dropdown for our players
        return (
            <div className={styles.formGroup}>
                <label htmlFor={label.toLowerCase().replace(' ', '')}>{label}</label>
                <select id={label.toLowerCase().replace(' ', '')} value={value} onChange={(e) => setter(e.target.value)} required={isRequired}>
                    <option value="" disabled>Select player...</option>
                    {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                    {label === 'Scorer' && <option value="Own Goal">Own Goal</option>}
                </select>
            </div>
        );
    };

    const renderAssistField = () => {
        if (team !== ourTeamKey) return null; // No assist field for opposition
        return (
            <div className={styles.formGroup}>
                <label htmlFor="assist">Assist By (Optional)</label>
                <select id="assist" value={player2} onChange={(e) => setPlayer2(e.target.value)}>
                    <option value="">None</option>
                    {match.squadList.filter(p => p !== player1).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
        );
    };


    const renderFormContent = () => {
        switch (eventType) {
            case 'Goal':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label>Team</label>
                            <div className={styles.teamSelector}>
                                <button type="button" className={team === 'home' ? styles.active : ''} onClick={() => setTeam('home')}>{match.homeTeamName}</button>
                                <button type="button" className={team === 'away' ? styles.active : ''} onClick={() => setTeam('away')}>{match.awayTeamName}</button>
                            </div>
                        </div>
                        {renderPlayerField('Scorer', player1, setPlayer1, true)}
                        {renderAssistField()}
                    </>
                );
            case 'Yellow Card':
            case 'Red Card':
                return (
                     <>
                        <div className={styles.formGroup}>
                            <label>Team</label>
                            <div className={styles.teamSelector}>
                                <button type="button" className={team === 'home' ? styles.active : ''} onClick={() => setTeam('home')}>{match.homeTeamName}</button>
                                <button type="button" className={team === 'away' ? styles.active : ''} onClick={() => setTeam('away')}>{match.awayTeamName}</button>
                            </div>
                        </div>
                        {renderPlayerField('Player', player1, setPlayer1, true)}
                    </>
                );
            case 'Substitution':
                return (
                    <>
                         <div className={styles.formGroup}>
                            <label>Team</label>
                            <p className={styles.teamNotice}>Substitutions can only be logged for our team.</p>
                        </div>
                        {renderPlayerField('Player Off', player1, setPlayer1, true)}
                        {renderPlayerField('Player On', player2, setPlayer2, true)}
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}><h3>Log: {eventType}</h3></header>
            <form onSubmit={handleSubmit} className={styles.formBody}>
                {apiError && <p className={styles.apiError}>{apiError}</p>}
                {renderFormContent()}
                <div className={styles.formGroup}>
                    <label htmlFor="minute">Minute</label>
                    <input id="minute" type="number" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="e.g., 42" required min="1" />
                </div>
                <div className={styles.formFooter}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Logging...' : 'Log Event'}
                    </button>
                </div>
            </form>
        </div>
    );
}
