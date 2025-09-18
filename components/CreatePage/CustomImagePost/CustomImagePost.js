/*
 * ==========================================================
 * COMPONENT: CustomImagePost
 * PAGE: /
 * FILE: /components/CreatePage/CustomImagePost/CustomImagePost.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import CustomImageForm from '../../common/PostCreationForms/CustomImageForm/CustomImageForm';
import { useAppContext } from '../../../app/context/AppContext';
import styles from './CustomImagePost.module.css';

// Helper function to generate time slots
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};

export default function CustomImagePost() {
    const { authKey } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [timeSlots, setTimeSlots] = useState([]);
    
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    // MODIFIED: Added state for the form's key to trigger a reset
    const [formKey, setFormKey] = useState(Date.now());

    useEffect(() => {
        setTimeSlots(generateTimeSlots());
    }, []);
    
    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => {
            setFeedback({ message: '', type: '' });
        }, 5000);
    };

    const handleSubmit = async ({ imageFile, caption, action }) => {
        if (!authKey) {
            showFeedback('Authorization key is not set. Please set it in Settings.', 'error');
            return;
        }
        setIsSubmitting(true);
        setFeedback({ message: '', type: '' });

        let endpoint = '';
        const formData = new FormData();
        
        if (action === 'post_now') {
            endpoint = '/api/post-now';
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('action', action);

        } else if (action === 'schedule') {
            endpoint = '/api/schedule-custom-post';
            const localDateTime = new Date(`${selectedDate}T${selectedTime}`);
            formData.append('post_id', self.crypto.randomUUID());
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('schedule_time_utc', localDateTime.toISOString());
            formData.append('action', action);
        } else {
            showFeedback('Invalid action specified.', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authKey}`
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit post');
            }
            
            showFeedback(result.message || 'Action completed successfully!', 'success');
            
            // MODIFIED: Change the key to force the form component to re-mount and reset its state
            setFormKey(Date.now());

        } catch (error) {
            console.error(`Error submitting to ${endpoint}:`, error);
            showFeedback(`An error occurred: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            {feedback.message && (
                <div className={`${styles.feedbackMessage} ${styles[feedback.type]}`}>
                    {feedback.message}
                </div>
            )}
            <CustomImageForm
                // MODIFIED: Added the key prop
                key={formKey} 
                context="create"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                selectedDate={selectedDate}
                onDateChange={(e) => setSelectedDate(e.target.value)}
                selectedTime={selectedTime}
                onTimeChange={(e) => setSelectedTime(e.target.value)}
                timeSlots={timeSlots}
            />
        </div>
    );
}
