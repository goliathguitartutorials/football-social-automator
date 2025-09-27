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

export default function EventForm({ eventType, match, onCancel, onSubmit, initialMinute, isSubmitting, apiError }) {
    const [minute, setMinute] = useState(initialMinute || '1');
    const [team, setTeam] = useState('home');
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');

    // State for the 'Start Match' form
    const [startType, setStartType] = useState('now'); // now, ago, specific
    const [minutesAgo, setMinutesAgo] = useState('1');
    const [specificTime, setSpecificTime] = useState(new Date().toTimeString().substring(0, 5));
    
    const ourTeamKey = match.homeOrAway === 'Home' ? 'home' : 'away';

    useEffect(() => { setPlayer1(''); setPlayer2(''); }, [team]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let eventData = { 
            matchId: match.matchId, 
            eventType, 
            minute, 
            team, 
            scorer: player1, 
            assist: player2, 
            player: player1, 
            playerOff: player1, 
            playerOn: player2 
        };
        
        if (eventType === 'MATCH_START') {
            let startTime = new Date();
            if (startType === 'ago') {
                startTime.setMinutes(startTime.getMinutes() - parseInt(minutesAgo, 10));
            } else if (startType === 'specific') {
                const [hours, minutes] = specificTime.split(':');
                const newStartTime = new Date(match.matchDate);
                newStartTime.setHours(hours, minutes, 0, 0);
                startTime = newStartTime;
            }
            eventData.startTime = startTime.toISOString();
            eventData.minute = '1'; // Match start is always the 1st minute
        }

        onSubmit(eventData);
    };

    const renderPlayerField = (label, value, setter, isRequired) => {
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
        if (team !== ourTeamKey) return null;
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
        if (eventType === 'MATCH_START') {
            return (
                 <div className={styles.formGroup}>
                    <label>When did the match start?</label>
                    <div className={styles.teamSelector}>
                        <button type="button" className={startType === 'now' ? styles.active : ''} onClick={() => setStartType('now')}>Now</button>
                        <button type="button" className={startType === 'ago' ? styles.active : ''} onClick={() => setStartType('ago')}>Minutes Ago</button>
                        <button type="button" className={startType === 'specific' ? styles.active : ''} onClick={() => setStartType('specific')}>Specific Time</button>
                    </div>
                    <div className={styles.startTypeInputs}>
                        {startType === 'ago' && <input type="number" value={minutesAgo} onChange={(e) => setMinutesAgo(e.target.value)} placeholder="e.g., 5" min="1" />}
                        {startType === 'specific' && <input type="time" value={specificTime} onChange={(e) => setSpecificTime(e.target.value)} />}
                    </div>
                </div>
            );
        }
        
        switch (eventType) {
            case 'Goal':
                return <>
                    <div className={styles.formGroup}><label>Team</label><div className={styles.teamSelector}><button type="button" className={team === 'home' ? styles.active : ''} onClick={() => setTeam('home')}>{match.homeTeamName}</button><button type="button" className={team === 'away' ? styles.active : ''} onClick={() => setTeam('away')}>{match.awayTeamName}</button></div></div>
                    {renderPlayerField('Scorer', player1, setPlayer1, true)}
                    {renderAssistField()}
                </>;
            case 'Yellow Card':
            case 'Red Card':
                return <>
                    <div className={styles.formGroup}><label>Team</label><div className={styles.teamSelector}><button type="button" className={team === 'home' ? styles.active : ''} onClick={() => setTeam('home')}>{match.homeTeamName}</button><button type="button" className={team === 'away' ? styles.active : ''} onClick={() => setTeam('away')}>{match.awayTeamName}</button></div></div>
                    {renderPlayerField('Player', player1, setPlayer1, true)}
                </>;
            case 'Substitution':
                return <>
                    <div className={styles.formGroup}><label>Team</label><p className={styles.teamNotice}>Substitutions can only be logged for our team.</p></div>
                    {renderPlayerField('Player Off', player1, setPlayer1, true)}
                    {renderPlayerField('Player On', player2, setPlayer2, true)}
                </>;
            default: return null;
        }
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}><h3>{eventType === 'MATCH_START' ? 'Start Match' : `Log: ${eventType}`}</h3></header>
            <form onSubmit={handleSubmit} className={styles.formBody}>
                {apiError && <p className={styles.apiError}>{apiError}</p>}
                {renderFormContent()}
                {eventType !== 'MATCH_START' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="minute">Minute</label>
                        <input id="minute" type="number" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="e.g., 42" required min="1" />
                    </div>
                )}
                <div className={styles.formFooter}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Logging...' : (eventType === 'MATCH_START' ? 'Start Match' : 'Log Event')}
                    </button>
                </div>
            </form>
        </div>
    );
}
