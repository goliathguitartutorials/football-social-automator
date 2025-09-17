/*
 * ==========================================================
 * COMPONENT: PostPreviewAndEditView
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/PostPreviewAndEditView/PostPreviewAndEditView.js
 * ==========================================================
*/
'use client';
import { useState, useEffect } from 'react';
import styles from './PostPreviewAndEditView.module.css';
import { useAppContext } from '@/app/context/AppContext';
import { GenerateIcon, DeleteIcon, CalendarIcon, BackIcon } from './PostPreviewAndEditViewIcons';

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();

export default function PostPreviewAndEditView({ post, mode = 'edit', onClose, onPostUpdated, onSchedule }) {
    const { authKey } = useAppContext();

    const [editedCaption, setEditedCaption] = useState(post.post_caption || '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
    const [view, setView] = useState('details');

    const initialDate = new Date(post.scheduled_time_utc);
    const [scheduleDate, setScheduleDate] = useState(initialDate.toISOString().split('T')[0]);
    const roundedMinutes = Math.floor(initialDate.getUTCMinutes() / 15) * 15;
    const initialTime = `${initialDate.getUTCHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    const [scheduleTime, setScheduleTime] = useState(initialTime);
    
    useEffect(() => {
        const postDate = new Date(post.scheduled_time_utc);
        setEditedCaption(post.post_caption || '');
        setScheduleDate(postDate.toISOString().split('T')[0]);
        const postRoundedMinutes = Math.floor(postDate.getUTCMinutes() / 15) * 15;
        const postInitialTime = `${postDate.getUTCHours().toString().padStart(2, '0')}:${postRoundedMinutes.toString().padStart(2, '0')}`;
        setScheduleTime(postInitialTime);
        setView('details');
        setFeedbackMessage({ type: '', text: '' });
    }, [post]);

    const handleApiAction = async (payload, successMessage) => {
        setIsProcessing(true);
        setFeedbackMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/schedule-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Failed to process request.');
            setFeedbackMessage({ type: 'success', text: successMessage || result.message });
            setTimeout(() => onPostUpdated && onPostUpdated(), 1500);
        } catch (err) {
            setFeedbackMessage({ type: 'error', text: err.message });
            setIsProcessing(false);
        }
    };

    const handleUpdateCaption = () => handleApiAction({ action: 'update_caption', post_id: post.id, new_caption: editedCaption }, 'Caption updated!');
    const handleDelete = () => handleApiAction({ action: 'delete_post', post_id: post.id }, 'Post deleted.');
    const handleReschedule = () => handleApiAction({ action: 'reschedule_post', post_id: post.id, new_schedule_time_utc: new Date(`${scheduleDate}T${scheduleTime}:00.000Z`).toISOString() }, 'Post rescheduled!');
    
    const handlePrimaryAction = () => {
        if (mode === 'create') {
            setIsProcessing(true);
            // Pass the refined data back to the parent component to handle the API call
            onSchedule({
                caption: editedCaption,
                date: scheduleDate,
                time: scheduleTime,
            });
        } else {
            handleReschedule();
        }
    };
    
    const renderContent = () => {
        if (view === 'confirm_delete' && mode === 'edit') {
            return (
                <div className={styles.confirmationView}>
                    <h3>Confirm Deletion</h3>
                    <p>Are you sure you want to delete this scheduled post? This action cannot be undone.</p>
                    <div className={styles.confirmationActions}>
                        <button onClick={() => setView('details')} className={styles.cancelButton} disabled={isProcessing}>Cancel</button>
                        <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isProcessing}>{isProcessing ? 'Deleting...' : 'Yes, Delete Post'}</button>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.previewLayout}>
                <div className={styles.previewImageWrapper}>
                    {isProcessing && <div className={styles.imageOverlay}>Processing...</div>}
                    <img src={post.image_url} alt="Post preview" className={styles.previewImage} />
                </div>
                <div className={styles.previewControls}>
                    <div className={styles.previewSection}>
                        <div className={styles.previewSectionHeader}>
                            <label htmlFor="previewCaption">Post Caption</label>
                            <button className={styles.aiButton} disabled={true}><GenerateIcon /> Generate with AI</button>
                        </div>
                        <textarea id="previewCaption" className={styles.previewCaptionTextarea} value={editedCaption} onChange={(e) => setEditedCaption(e.target.value)} rows={8} disabled={isProcessing} />
                        {mode === 'edit' && (
                             <button onClick={handleUpdateCaption} className={styles.actionButton} disabled={isProcessing || editedCaption === post.post_caption}>
                                {isProcessing ? 'Saving...' : 'Update Caption'}
                            </button>
                        )}
                    </div>

                    <div className={styles.previewSection}>
                        <label>Schedule for...</label>
                        <div className={styles.scheduleInputs}>
                            <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} disabled={isProcessing} />
                            <select value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} disabled={isProcessing}>
                                {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <button onClick={handlePrimaryAction} className={`${styles.actionButton} ${styles.rescheduleButton}`} disabled={isProcessing}>
                            <CalendarIcon />
                            {mode === 'create' ? (isProcessing ? 'Scheduling...' : 'Schedule Post') : (isProcessing ? 'Rescheduling...' : 'Reschedule')}
                        </button>
                    </div>

                    {mode === 'edit' && (
                        <div className={styles.previewSection}>
                            <label>Danger Zone</label>
                            <button onClick={() => setView('confirm_delete')} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isProcessing}>
                                <DeleteIcon /> Delete Post
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.previewContainer}>
            <div className={styles.topBar}>
                <button onClick={onClose} className={styles.backButton} disabled={isProcessing}>
                    <BackIcon />
                    <span>{mode === 'create' ? 'Back to Form' : 'Back to Calendar'}</span>
                </button>
                <h2>{mode === 'create' ? 'Preview & Refine' : 'Edit Scheduled Post'}</h2>
            </div>
            {feedbackMessage.text && <p className={`${styles.message} ${styles[feedbackMessage.type]}`}>{feedbackMessage.text}</p>}
            {renderContent()}
        </div>
    );
}
