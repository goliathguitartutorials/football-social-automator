/*
 * ==========================================================
 * COMPONENT: CustomImageForm
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/PostCreationForms/CustomImageForm/CustomImageForm.js
 * ==========================================================
 */
'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './CustomImageForm.module.css';
import { UploadIcon, EditIcon, ScheduleIcon, PostNowIcon } from './CustomImageFormIcons';

const CanvasEditor = dynamic(() => import('../../CanvasEditor/CanvasEditor'), {
    ssr: false,
    loading: () => <p>Loading Editor...</p>
});

export default function CustomImageForm({
    context = 'schedule',
    onSubmit,
    isSubmitting,
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
    timeSlots
}) {
    // **FIX**: State is now split to manage the original and final (cropped) images separately.
    const [imageForSubmission, setImageForSubmission] = useState(null);    // The file to be submitted (can be original or cropped)
    const [imageForPreview, setImageForPreview] = useState('');            // The preview URL shown on the form
    const [originalImageForEditor, setOriginalImageForEditor] = useState(''); // The original, un-cropped image URL for the editor
    
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('upload');

    // Effect to clean up object URLs and prevent memory leaks
    useEffect(() => {
        return () => {
            if (imageForPreview) URL.revokeObjectURL(imageForPreview);
            if (originalImageForEditor) URL.revokeObjectURL(originalImageForEditor);
        };
    }, []); // Runs once on component unmount

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            // Clean up any old preview URLs to prevent memory leaks
            if (imageForPreview) URL.revokeObjectURL(imageForPreview);
            if (originalImageForEditor) URL.revokeObjectURL(originalImageForEditor);
            
            const previewUrl = URL.createObjectURL(file);

            // Set all states to the new original image
            setImageForSubmission(file);
            setOriginalImageForEditor(previewUrl);
            setImageForPreview(previewUrl);

        } else if (file) {
            alert("Please upload a valid image file (PNG or JPG).");
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleFormSubmit = (action) => {
        if (!imageForSubmission) {
            alert("Please upload an image before submitting.");
            return;
        }
        // Pass the final image (imageForSubmission) to the parent
        onSubmit({ imageFile: imageForSubmission, caption, action });
    };

    // **MODIFIED**: This handler now only updates the submission file and form preview.
    // The original image for the editor is left untouched.
    const handleCropConfirm = (croppedImageBlob) => {
        const croppedFile = new File([croppedImageBlob], "cropped-image.png", { type: "image/png" });
        
        // Update the state with the new cropped image for submission
        setImageForSubmission(croppedFile);
        
        // Clean up the old form preview URL
        if (imageForPreview) URL.revokeObjectURL(imageForPreview);
        
        // Create and set the new preview URL for the form
        setImageForPreview(URL.createObjectURL(croppedFile));

        // Switch back to the upload form view
        setViewMode('upload');
    };

    if (viewMode === 'editor') {
        // **FIX**: The CanvasEditor is now ALWAYS passed the original, full-size image.
        return <CanvasEditor 
                    imagePreview={originalImageForEditor} 
                    onBack={() => setViewMode('upload')} 
                    onConfirm={handleCropConfirm} 
                />;
    }

    return (
        <form className={styles.formContainer} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.unifiedLayout}>
                <div className={styles.imageColumn}>
                    {!imageForPreview ? (
                        <div className={styles.uploadArea} onClick={triggerFileInput} role="button" tabIndex={0}>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                            <div className={styles.uploadIcon}><UploadIcon /></div>
                            <p className={styles.uploadText}>Click to upload an image</p>
                            <p className={styles.uploadSubtext}>PNG or JPG</p>
                        </div>
                    ) : (
                        <img src={imageForPreview} alt="Post preview" className={styles.previewImage} />
                    )}
                </div>

                <div className={styles.controlsColumn}>
                    <div className={styles.controlSection}>
                        <label htmlFor="caption" className={styles.sectionLabel}>Post Caption</label>
                        <textarea id="caption" className={styles.captionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption here..." rows={8} />
                    </div>

                    {imageForPreview && (
                        <div className={`${styles.controlSection} ${styles.imageActions}`}>
                            <button type="button" className={styles.actionButton_FullWidth} onClick={() => setViewMode('editor')}>
                                <EditIcon /> Adjust Canvas
                            </button>
                            <button type="button" className={styles.actionButton_Secondary} onClick={triggerFileInput}>
                                Change Image
                            </button>
                        </div>
                    )}
                    
                    <div className={styles.controlSection}>
                        <label className={styles.sectionLabel}>Schedule for...</label>
                        <div className={styles.dateTimeInputs}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="schedule-date-form">Date</label>
                                <input id="schedule-date-form" type="date" value={selectedDate} onChange={onDateChange} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="schedule-time-form">Time</label>
                                <select id="schedule-time-form" value={selectedTime} onChange={onTimeChange}>
                                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.controlSection} ${styles.finalActions}`}>
                        {context === 'create' && (
                            <button type="button" onClick={() => handleFormSubmit('post_now')} disabled={isSubmitting || !imageForSubmission} className={styles.actionButton_PostNow}>
                                <PostNowIcon />
                                {isSubmitting ? 'Posting...' : 'Post Now'}
                            </button>
                        )}
                        <button type="button" onClick={() => handleFormSubmit('schedule')} disabled={isSubmitting || !imageForSubmission} className={styles.actionButton_Schedule}>
                            <ScheduleIcon />
                            {isSubmitting ? 'Scheduling...' : (context === 'create' ? 'Schedule for Later' : 'Schedule Post')}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
