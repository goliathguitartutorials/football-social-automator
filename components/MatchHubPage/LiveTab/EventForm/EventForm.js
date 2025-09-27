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

// Reusable form fields
const MinuteField = ({ value, onChange }) => (
    <div className={styles.formGroup}>
        <label htmlFor="minute">Minute</label>
        <input id="minute" type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="e.g., 45" />
    </div>
);

const TeamField = ({ value, onChange, match }) => (
    <div className={styles.formGroup}>
        <label htmlFor="team">Team</label>
        <select id="team" value={value} onChange={e => onChange(e.target.value)}>
            <option value="">Select Team</option>
            <option value="home">{match.homeTeamName}</option>
            <option value="away">{match.awayTeamName}</option>
        </select>
    </div>
);

const PlayerField = ({ id, label, value, onChange, squadList }) => (
    <div className={styles.formGroup}>
        <label htmlFor={id}>{label}</label>
        <input id={id} type="text" list={`${id}-list`} value={value} onChange={e => onChange(e.target.value)} />
        <datalist id={`${id}-list`}>
            {squadList.map(player => <option key={player} value={player} />)}
        </datalist>
    </div>
);


export default function EventForm({ eventType, match, onCancel, onSubmit, initialMinute, isSubmitting: parentIsSubmitting, setApiError }) {
    const [minute, setMinute] = useState(initialMinute || '');
    const [team, setTeam] = useState('');
    const [player, setPlayer] = useState('');
    const [assist, setAssist] = useState('');
    const [playerOff, setPlayerOff] = useState('');
    const [playerOn, setPlayerOn] = useState('');
    const [startTimeOption, setStartTimeOption] = useState('schedule');
    const [specificTime, setSpecificTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setApiError('');

        let submissionData = { eventType, minute: parseInt(minute, 10), team };

        if (eventType === 'Goal') {
            submissionData.scorer = player;
            submissionData.assist = assist;
        } else if (eventType.includes('Card')) {
            submissionData.player = player;
        } else if (eventType === 'Substitution') {
            submissionData.playerOff = playerOff;
            submissionData.playerOn = playerOn;
        } else if (eventType === 'MATCH_START') {
            if (startTimeOption === 'schedule') {
                submissionData.startTime = `${match.matchDate} ${match.matchTime}`;
            } else if (startTimeOption === 'now') {
                submissionData.startTime = new Date().toISOString();
            } else { // 'specific'
                submissionData.startTime = specificTime ? new Date(specificTime).toISOString() : new Date().toISOString();
            }
             submissionData.minute = 0;
        }
        
        try {
            await onSubmit(submissionData);
        } catch (error) {
            // Error is handled in the parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFormFields = () => {
        if (eventType === 'MATCH_START') {
            return (
                <div className={styles.startMatchOptions}>
                    <div className={styles.radioGroup}>
                        <input type="radio" id="on-schedule" name="startTime" value="schedule" checked={startTimeOption === 'schedule'} onChange={() => setStartTimeOption('schedule')} />
                        <label htmlFor="on-schedule">On Schedule ({new Date(`${match.matchDate} ${match.matchTime}`).toLocaleTimeString()})</label>
                    </div>
                    <div className={styles.radioGroup}>
                        <input type="radio" id="now" name="startTime" value="now" checked={startTimeOption === 'now'} onChange={() => setStartTimeOption('now')} />
                        <label htmlFor="now">Now</label>
                    </div>
                    <div className={styles.radioGroup}>
                        <input type="radio" id="specific" name="startTime" value="specific" checked={startTimeOption === 'specific'} onChange={() => setStartTimeOption('specific')} />
                        <label htmlFor="specific">Specific Time</label>
                        {startTimeOption === 'specific' && (
                            <input type="datetime-local" value={specificTime} onChange={e => setSpecificTime(e.target.value)} className={styles.timeInput} />
                        )}
                    </div>
                </div>
            );
        }

        const commonFields = (
            <>
                <MinuteField value={minute} onChange={setMinute} />
                <TeamField value={team} onChange={setTeam} match={match} />
            </>
        );

        switch (eventType) {
            case 'Goal':
                return (
                    <>
                        {commonFields}
                        <PlayerField id="scorer" label="Goal Scorer" value={player} onChange={setPlayer} squadList={match.squadList} />
                        <PlayerField id="assist" label="Assist By (Optional)" value={assist} onChange={setAssist} squadList={match.squadList} />
                    </>
                );
            case 'Yellow Card':
            case 'Red Card':
                return (
                    <>
                        {commonFields}
                        <PlayerField id="player" label="Player" value={player} onChange={setPlayer} squadList={match.squadList} />
                    </>
                );
            case 'Substitution':
                return (
                    <>
                        {commonFields}
                        <PlayerField id="playerOff" label="Player Off" value={playerOff} onChange={setPlayerOff} squadList={match.squadList} />
                        <PlayerField id="playerOn" label="Player On" value={playerOn} onChange={setPlayerOn} squadList={match.squadList} />
                    </>
                );
            default:
                return <p>Invalid event type.</p>;
        }
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit}>
                <h3 className={styles.formHeader}>Log: {eventType}</h3>
                <div className={styles.formBody}>
                    {renderFormFields()}
                </div>
                <div className={styles.formActions}>
                    <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                    <button type="submit" disabled={isSubmitting || parentIsSubmitting} className={styles.submitButton}>
                        {isSubmitting ? 'Logging...' : 'Log Event'}
                    </button>
                </div>
            </form>
        </div>
    );
}
