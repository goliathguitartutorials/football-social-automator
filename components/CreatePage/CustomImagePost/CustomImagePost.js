/*
 * ==========================================================
 * COMPONENT: CustomImagePost
 * PAGE: /
 * FILE: /components/CreatePage/CustomImagePost/CustomImagePost.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
// CORRECTED: The directory name is case-sensitive.
import CustomImageForm from '../../common/PostCreationForms/CustomImageForm/CustomImageForm'; 
// CORRECTED: The context is inside the /app directory.
import { useAppContext } from '../../../app/context/AppContext'; 
import styles from './CustomImagePost.module.css';

// Helper function to get the user's local timezone
const getLocalTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

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
    
    // State for date and time inputs
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [timeSlots, setTimeSlots] = useState([]);

    useEffect(() => {
        setTimeSlots(generateTimeSlots());
    }, []);

    const handleSubmit = async ({ imageFile, caption, action }) => {
        if (!authKey) {
            alert('Authorization key is not set. Please set it in the Settings page.');
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('caption', caption);
        formData.append('action', action);

        // If scheduling, combine date and time and convert to UTC ISO string
        if (action === 'schedule') {
            const localDateTime = new Date(`${selectedDate}T${selectedTime}`);
            formData.append('schedule_time_utc', localDateTime.toISOString());
            formData.append('timezone', getLocalTimeZone());
        }

        try {
            // NOTE: This assumes you have an API route at /api/upload-asset that can handle this FormData.
            const response = await fetch('/api/upload-asset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authKey}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit post');
            }

            const result = await response.json();
            alert(result.message || 'Action completed successfully!');
            // Optionally reset form state here
        } catch (error) {
            console.error('Error submitting custom post:', error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <CustomImageForm
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
