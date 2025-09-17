/*
 * ==========================================================
 * COMPONENT: PreviewModal
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/PreviewModal/PreviewModal.js
 ==========================================================
*/
import { useState } from 'react';
import styles from './PreviewModal.module.css';
import { EditIcon, DeleteIcon } from '../../AssetDetailsModal/AssetDetailsModalIcons';
import { CalendarIcon as RescheduleIcon } from '../SchedulePageIcons';

// Helper to generate 15-minute time slots for the dropdown
const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();

export default function PreviewModal({ post, onClose, onManagePost, authKey }) {
    if (!post) return null;

    const [currentView, setCurrentView] = useState('details');
    const [editedCaption, setEditedCaption] = useState(post.post_caption);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');

    // State for the new date and time pickers
    const initialDate = new Date(post.scheduled_time_utc);
    const [rescheduleDate, setRescheduleDate] = useState(initialDate.toISOString().split('T')[0]);
    const roundedMinutes = Math.floor(initialDate.getUTCMinutes() / 15) * 15;
    const initialTime = `${initialDate.getUTCHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState(initialTime);

    const handleApiAction = async (payload) => {
        setIsProcessing(true);
        setErrorMessage('');
        setConfirmationMessage('');

        try {
            const response = await fetch('/api/schedule-manager', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authKey}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to process the request.');
            }
            
            setConfirmationMessage(result.message);

            setTimeout(() => {
                if(onManagePost) onManagePost();
                onClose();
            }, 1500);

        } catch (err) {
            setErrorMessage(err.message);
            setIsProcessing(false);
        }
    };
    
    const handleUpdateCaption = () => {
        handleApiAction({
            action: 'update_caption',
            post_id: post.id,
            new_caption: editedCaption,
        });
    };

    const handleDelete = () => {
        handleApiAction({
            action: 'delete_post',
            post_id: post.id,
        });
    };

    const handleReschedule = () => {
        // Combine date and time slot into a standardized UTC string
        const newUtcDate = `${rescheduleDate}T${rescheduleTimeSlot}:00.000Z`;
        handleApiAction({
            action: 'reschedule_post',
            post_id: post.id,
            new_schedule_time_utc: newUtcDate,
        });
    };

    const renderContent = () => {
        if (confirmationMessage) {
            return (
                <div className={styles.confirmationView}>
                    <h3>Success!</h3>
                    <p>{confirmationMessage}</p>
                </div>
            );
        }

        if (currentView === 'confirm_delete') {
            return (
                <div className={styles.confirmationView}>
                    <h3>Confirm Deletion</h3>
                    <p>Are you sure you want to delete this scheduled post?</p>
                    <div className={styles.viewActions}>
                        <button onClick={() => setCurrentView('details')} className={styles.cancelButton} disabled={isProcessing}>Cancel</button>
                        <button onClick={handleDelete} className={`${styles.confirmButton} ${styles.deleteButton}`} disabled={isProcessing}>
                            {isProcessing ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            );
        }

        if (currentView === 'edit_caption') {
            return (
                <div>
                    <h3>Edit Caption</h3>
                    <textarea className={styles.captionInput} value={editedCaption} onChange={(e) => setEditedCaption(e.target.value)} disabled={isProcessing} />
                    <div className={styles.viewActions}>
                        <button onClick={() => setCurrentView('details')} className={styles.cancelButton} disabled={isProcessing}>Cancel</button>
                        <button onClick={handleUpdateCaption} className={styles.confirmButton} disabled={isProcessing}>
                            {isProcessing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            );
        }

        if (currentView === 'reschedule') {
            return (
                <div>
                    <h3>Reschedule Post</h3>
                    <div className={styles.rescheduleInputs}>
                        <input 
                            type="date" 
                            className={styles.rescheduleInput} 
                            value={rescheduleDate} 
                            onChange={(e) => setRescheduleDate(e.target.value)} 
                            disabled={isProcessing}
                        />
                        <select 
                            className={styles.rescheduleInput} 
                            value={rescheduleTimeSlot} 
                            onChange={(e) => setRescheduleTimeSlot(e.target.value)} 
                            disabled={isProcessing}
                        >
                            {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                    </div>
                    <div className={styles.viewActions}>
                        <button onClick={() => setCurrentView('details')} className={styles.cancelButton} disabled={isProcessing}>Cancel</button>
                        <button onClick={handleReschedule} className={styles.confirmButton} disabled={isProcessing}>
                             {isProcessing ? 'Rescheduling...' : 'Reschedule'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <img src={post.image_url} alt="Scheduled Post" className={styles.modalImage} />
                <p className={styles.modalCaption}>{post.post_caption}</p>
                <div className={styles.mainActions}>
                    <button onClick={() => setCurrentView('edit_caption')} className={styles.actionButton}><EditIcon /><span>Edit</span></button>
                    <button onClick={() => setCurrentView('reschedule')} className={styles.actionButton}><RescheduleIcon /><span>Reschedule</span></button>
                    <button onClick={() => setCurrentView('confirm_delete')} className={`${styles.actionButton} ${styles.deleteButtonAction}`}><DeleteIcon /><span>Delete</span></button>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.modalBackdrop} onClick={isProcessing ? undefined : onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={isProcessing ? undefined : onClose} disabled={isProcessing}>&times;</button>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                {renderContent()}
            </div>
        </div>
    );
}
