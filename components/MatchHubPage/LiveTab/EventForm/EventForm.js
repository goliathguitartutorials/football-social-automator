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
    const [minute, setMinute] = useState(initialMinute || '');
    const [team, setTeam] = useState('home');
    const [player1, setPlayer1] = useState(''); // Used for scorer, carded player, sub off
    const [player2, setPlayer2] = useState(''); // Used for assist, sub on
    
    // NEW: State for the MATCH_START options
    const [startTimeOption, setStartTimeOption] = useState('now');
    const [specificTime, setSpecificTime] = useState('');
    
    const ourTeamKey = match.homeOrAway === 'Home' ? 'home' : 'away';

    useEffect(() => {
        setPlayer1('');
        setPlayer2('');
    }, [team]);

    const handleSubmit = (e) => {
        e.preventDefault();
        let eventData = {
            matchId: match.matchId, eventType, minute, team,
        };

        // Handle MATCH_START event separately
        if (eventType === 'MATCH_START') {
            if (startTimeOption === 'schedule') {
                eventData.startTime = `${match.matchDate} ${match.matchTime}`;
            } else if (startTimeOption === 'now') {
                eventData.startTime = new Date().toISOString();
            } else { // 'specific'
                eventData.startTime = specificTime ? new Date(specificTime).toISOString() : new Date().toISOString();
            }
            eventData.minute = 0;
        } else {
        // Handle all other events
            eventData = {
                ...eventData,
                ...(eventType === 'Goal' && { scorer: player1, assist: player2 }),
                ...(eventType.includes('Card') && { player: player1 }),
                ...(eventType === 'Substitution' && { playerOff: player1, playerOn: player2 }),
            };
        }
        
        onSubmit(eventData);
    };

    const renderPlayerField = (label, value, setter, isRequired) => {
        if (team !== ourTeamKey) {
            return (
                <div className={styles.formGroup}>
                    <label htmlFor={label.toLowerCase().replace(' ', '')}>{label} (Optional)</label>
                    <input type="text" id={label.toLowerCase().replace(' ', '')} value={value} onChange={(e) => setter(e.target.value)} placeholder="Enter player name if known" />
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
        // NEW: Special view for MATCH_START event type
        if (eventType === 'MATCH_START') {
            return (
                <div className={styles.startMatchOptions}>
                    <div className={styles.formGroup}>
                        <label>Choose Start Time</label>
                        <div className={styles.teamSelector}>
                            <button type="button" className={startTimeOption === 'schedule' ? styles.active : ''} onClick={() => setStartTimeOption('schedule')}>On Schedule</button>
                            <button type="button" className={startTimeOption === 'now' ? styles.active : ''} onClick={() => setStartTimeOption('now')}>Now</button>
                            <button type="button" className={startTimeOption === 'specific' ? styles.active : ''} onClick={() => setStartTimeOption('specific')}>Specific</button>
                        </div>
                    </div>
                    {startTimeOption === 'specific' && (
                        <div className={styles.formGroup}>
                            <input type="datetime-local" value={specificTime} onChange={e => setSpecificTime(e.target.value)} className={styles.timeInput} />
                        </div>
                    )}
                </div>
            )
        }
        
        // Original form logic for other events
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
                {eventType !== 'MATCH_START' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="minute">Minute</label>
                        <input id="minute" type="number" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="e.g., 42" required min="0" />
                    </div>
                )}
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
