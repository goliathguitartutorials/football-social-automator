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
import PlayerMultiSelect from './PlayerMultiSelect';

export default function AddMatchForm({ onCancel }) {
    const [formData, setFormData] = useState({
        team: 'first-team',
        matchDate: '',
        matchTime: '14:30', // Default kick-off time
        homeOrAway: 'Home',
        opponent: '',
        competition: '',
        venue: '',
        squad: [], // Squad is now an array
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSquadChange = (newSquad) => {
        setFormData(prev => ({ ...prev, squad: newSquad }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert array to comma-separated string if needed by the backend, or send as is.
        const submissionData = {
            ...formData,
            squad: formData.squad.join(', ')
        };
        console.log("Submitting New Match:", submissionData);
        onCancel();
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Fixture Details</h3>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="team">Team</label>
                            <select id="team" name="team" value={formData.team} onChange={handleChange} required>
                                <option value="first-team">First Team</option>
                                <option value="development">Development</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="homeOrAway">Home / Away</label>
                            <select id="homeOrAway" name="homeOrAway" value={formData.homeOrAway} onChange={handleChange} required>
                                <option value="Home">Home</option>
                                <option value="Away">Away</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="matchDate">Date</label>
                            <input type="date" id="matchDate" name="matchDate" value={formData.matchDate} onChange={handleChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="matchTime">Kick-off Time</label>
                            <input type="time" id="matchTime" name="matchTime" value={formData.matchTime} onChange={handleChange} step="900" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="opponent">Opponent</label>
                            <input type="text" id="opponent" name="opponent" value={formData.opponent} onChange={handleChange} placeholder="e.g. Prestatyn Town" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="venue">Venue</label>
                            <input type="text" id="venue" name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. Morfa Glannau" required />
                        </div>
                    </div>
                     <div className={styles.formGroupFull}>
                        <label htmlFor="competition">Competition</label>
                        <input type="text" id="competition" name="competition" value={formData.competition} onChange={handleChange} placeholder="e.g. League Match" required />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Select Squad</h3>
                    <PlayerMultiSelect selectedPlayers={formData.squad} onChange={handleSquadChange} />
                </div>
                
                <div className={styles.actionsContainer}>
                    <button type="button" className={`${styles.actionButton} ${styles.cancelButton}`} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={styles.actionButton}>Save Match</button>
                </div>
            </form>
        </div>
    );
}
