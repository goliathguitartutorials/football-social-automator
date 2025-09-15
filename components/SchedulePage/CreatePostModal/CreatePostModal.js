/*
 * ==========================================================
 * COMPONENT: CreatePostModal
 * PAGE: /schedule
 * FILE: /components/SchedulePage/CreatePostModal/CreatePostModal.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import styles from './CreatePostModal.module.css';
import { useAppContext } from '@/app/context/AppContext';

import UpNextForm from '@/components/common/PostCreationForms/UpNextForm/UpNextForm';
import MatchDayForm from '@/components/common/PostCreationForms/MatchDayForm/MatchDayForm';
import SquadForm from '@/components/common/PostCreationForms/SquadForm/SquadForm';
import MatchResultForm from '@/components/common/PostCreationForms/MatchResultForm/MatchResultForm';

const postTypes = [
    { id: 'upNext', label: 'Up Next', component: UpNextForm, action: 'upNext' },
    { id: 'matchDay', label: 'Match Day', component: MatchDayForm, action: 'match_day_announcement' },
    { id: 'squad', label: 'Squad', component: SquadForm, action: 'squad_announcement' },
    { id: 'result', label: 'Result', component: MatchResultForm, action: 'result' },
];

export default function CreatePostModal({ isOpen, onClose, scheduleDate, onPostScheduled }) {
    const { appData, authKey } = useAppContext();
    const [selectedPostType, setSelectedPostType] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedPostType(null);
            setMessage('');
        }
    }, [isOpen]);

    const handleFormSubmit = async (formData) => {
        if (!authKey) {
            setMessage('Authorization key is missing.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        const payload = {
            action: 'schedule_post',
            schedule_time_utc: scheduleDate.toISOString(),
            post_details: {
                post_type: selectedPostType.id,
                action: selectedPostType.action,
                ...formData
            }
        };

        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule post.');
            
            setMessage('Post scheduled successfully!');
            onPostScheduled(); // Notify parent to refresh data
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const ActiveForm = selectedPostType?.component;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>
                <h2 className={styles.title}>
                    New Post for {scheduleDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>

                {!selectedPostType ? (
                    <div className={styles.selectorGrid}>
                        {postTypes.map(type => (
                            <button key={type.id} className={styles.typeButton} onClick={() => setSelectedPostType(type)}>
                                {type.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <button className={styles.backButton} onClick={() => setSelectedPostType(null)}>
                            &larr; Back to Post Types
                        </button>
                        <h3 className={styles.formTitle}>{selectedPostType.label}</h3>
                        <div className={styles.formWrapper}>
                            <ActiveForm
                                appData={appData}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                )}
                {message && <p className={styles.message}>{message}</p>}
            </div>
        </div>
    );
}
