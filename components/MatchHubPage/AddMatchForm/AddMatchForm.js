/*
 * ==========================================================
 * COMPONENT: AddMatchForm
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/AddMatchForm/AddMatchForm.js
 ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './AddMatchForm.module.css';

export default function AddMatchForm({ onCancel }) {
    const [formData, setFormData] = useState({
        team: 'first-team',
        matchDate: '',
        matchTime: '',
        homeOrAway: 'Home',
        opponent: '',
        competition: '',
        venue: '',
        squad: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting New Match:", formData);
        // Here we will call the API to create the match
        // For now, just log and cancel
        onCancel();
    };

    return (
        <div className={styles.formContainer}>
            <header className={styles.formHeader}>
                <h2>Add New Match</h2>
                <p>Enter the details for the upcoming fixture. This will add it to the schedule.</p>
            </header>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                    {/* Team Selection */}
                    <div className={styles.formGroup}>
                        <label htmlFor="team">Team</label>
                        <select id="team" name="team" value={formData.team} onChange={handleChange} required>
                            <option value="first-team">First Team</option>
                            <option value="development">Development</option>
                        </select>
                    </div>
                    {/* Home/Away */}
                    <div className={styles.formGroup}>
                        <label htmlFor="homeOrAway">Home / Away</label>
                        <select id="homeOrAway" name="homeOrAway" value={formData.homeOrAway} onChange={handleChange} required>
                            <option value="Home">Home</option>
                            <option value="Away">Away</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formRow}>
                     {/* Match Date */}
                    <div className={styles.formGroup}>
                        <label htmlFor="matchDate">Date</label>
                        <input type="date" id="matchDate" name="matchDate" value={formData.matchDate} onChange={handleChange} required />
                    </div>
                    {/* Match Time */}
                    <div className={styles.formGroup}>
                        <label htmlFor="matchTime">Kick-off Time</label>
                        <input type="time" id="matchTime" name="matchTime" value={formData.matchTime} onChange={handleChange} required />
                    </div>
                </div>

                {/* Opponent */}
                <div className={styles.formGroup}>
                    <label htmlFor="opponent">Opponent</label>
                    <input type="text" id="opponent" name="opponent" value={formData.opponent} onChange={handleChange} placeholder="e.g. Prestatyn Town" required />
                </div>

                <div className={styles.formRow}>
                    {/* Competition */}
                    <div className={styles.formGroup}>
                        <label htmlFor="competition">Competition</label>
                        <input type="text" id="competition" name="competition" value={formData.competition} onChange={handleChange} placeholder="e.g. League Match" required />
                    </div>
                    {/* Venue */}
                    <div className={styles.formGroup}>
                        <label htmlFor="venue">Venue</label>
                        <input type="text" id="venue" name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. Morfa Glannau" required />
                    </div>
                </div>

                {/* Squad */}
                <div className={styles.formGroup}>
                    <label htmlFor="squad">Squad (comma-separated)</label>
                    <textarea id="squad" name="squad" value={formData.squad} onChange={handleChange} rows="4" placeholder="e.g. Player A, Player B, Player C..." required />
                    <p className={styles.helpText}>Enter the full names of players, separated by commas.</p>
                </div>

                <div className={styles.formActions}>
                    <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={`${styles.button} ${styles.submitButton}`}>Save Match</button>
                </div>
            </form>
        </div>
    );
}
