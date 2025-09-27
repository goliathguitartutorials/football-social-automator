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
    const [team, setTeam] = useState('home'); // 'home' or 'away'
    const [player1, setPlayer1] = useState(''); // Used for scorer, carded player, sub off
    const [player2, setPlayer2] = useState(''); // Used for assist, sub on

    const ourTeamName = match.homeOrAway === 'Home' ? match.homeTeamName : match.awayTeamName;

    const handleSubmit = (e) => {
        e.preventDefault();
        const eventData = {
            matchId: match.matchId,
            eventType, minute, team,
            ...(eventType === 'Goal' && { scorer: player1, assist: player2 }),
            ...(eventType.includes('Card') && { player: player1 }),
            ...(eventType === 'Substitution' && { playerOff: player1, playerOn: player2 }),
        };
        onSubmit(eventData);
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
                        <div className={styles.formGroup}>
                            <label htmlFor="scorer">Scorer</label>
                            <select id="scorer" value={player1} onChange={(e) => setPlayer1(e.target.value)} required>
                                <option value="" disabled>Select player...</option>
                                {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                                <option value="Own Goal">Own Goal</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="assist">Assist By (Optional)</label>
                            <select id="assist" value={player2} onChange={(e) => setPlayer2(e.target.value)}>
                                <option value="">None</option>
                                {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
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
                        <div className={styles.formGroup}>
                            <label htmlFor="player">Player</label>
                            <select id="player" value={player1} onChange={(e) => setPlayer1(e.target.value)} required>
                                <option value="" disabled>Select player...</option>
                                {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </>
                );
            case 'Substitution':
                return (
                    <>
                         <div className={styles.formGroup}>
                            <label>Team</label>
                            <p className={styles.teamNotice}>Substitutions can only be logged for {ourTeamName}.</p>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="playerOff">Player Off</label>
                            <select id="playerOff" value={player1} onChange={(e) => setPlayer1(e.target.value)} required>
                                <option value="" disabled>Select player...</option>
                                {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="playerOn">Player On</label>
                            <select id="playerOn" value={player2} onChange={(e) => setPlayer2(e.target.value)} required>
                                <option value="" disabled>Select player...</option>
                                {match.squadList.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}><h3>Log: {eventType}</h3></header>
            <form onSubmit={handleSubmit} className={styles.formBody}>
                {renderFormContent()}
                <div className={styles.formGroup}>
                    <label htmlFor="minute">Minute</label>
                    <input id="minute" type="number" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="e.g., 42" required min="1" />
                </div>
                <div className={styles.formFooter}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={styles.submitButton}>Log Event</button>
                </div>
            </form>
        </div>
    );
}
