/*
 * ==========================================================
 * COMPONENT: AddMatchForm
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/ManageMatchView/AddMatchForm/AddMatchForm.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './AddMatchForm.module.css';
import PlayerMultiSelect from '@/components/common/PlayerMultiSelect/PlayerMultiSelect'; // MODIFIED: Corrected import path

const BLANK_FORM_STATE = {
    team: 'first-team',
    matchDate: '',
    matchTime: '14:30',
    homeOrAway: 'Home',
    opponent: '',
    competition: '',
    venue: '',
    squad: [],
};

export default function AddMatchForm({ initialData, onCancel, onMatchAdded }) {
    const { authKey, addOrUpdateMatch } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState(BLANK_FORM_STATE);

    const isEditMode = initialData && initialData.matchId;

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                ...initialData,
                squad: initialData.squad ? initialData.squad.split(',').map(s => s.trim()) : []
            });
        } else if (initialData && initialData.matchDate) {
            setFormData({
                ...BLANK_FORM_STATE,
                matchDate: initialData.matchDate
            });
        } else {
            setFormData(BLANK_FORM_STATE);
        }
    }, [initialData, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSquadChange = (newSquad) => {
        setFormData(prev => ({ ...prev, squad: newSquad }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!authKey) {
            setMessage('Authorization Key is missing.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        const payload = {
            action: isEditMode ? 'update_match' : 'add_match',
            matchData: {
                ...formData,
                squad: formData.squad.join(', '),
            },
        };

        try {
            const response = await fetch('/api/manage-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authKey}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save the match.');
            }
            
            if (Array.isArray(result) && result.length > 0) {
                addOrUpdateMatch(result[0]);
            }
            
            if (onMatchAdded) {
                onMatchAdded();
            }

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.section}>
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
                    <div className={styles.formGroupFull}>
                        <label htmlFor="competition">Competition</label>
                        <input type="text" id="competition" name="competition" value={formData.competition} onChange={handleChange} placeholder="e.g. League Match" required />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Select Squad</h3>
                <PlayerMultiSelect selectedPlayers={formData.squad || []} onChange={handleSquadChange} />
            </div>

            <div className={styles.actionsContainer}>
                <button type="button" className={`${styles.actionButton} ${styles.cancelButton}`} onClick={onCancel} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className={styles.actionButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Match'}
                </button>
            </div>

            {message && <p className={styles.message}>{message}</p>}
        </form>
    );
}
