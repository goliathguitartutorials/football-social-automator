/*
 * ==========================================================
 * COMPONENT: CustomImageForm
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/PostCreationForms/CustomImageForm/CustomImageForm.js
 * ==========================================================
 */
'use client';
import { useState, useRef } from 'react';
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
    const [imageForSubmission, setImageForSubmission] = useState(null);
    const [imageForPreview, setImageForPreview] = useState('');
    const [originalImageForEditor, setOriginalImageForEditor] = useState('');
    
    // **NEW**: State to store the last-used editor settings (position, zoom, etc.)
    const [editorState, setEditorState] = useState(null);

    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('upload');

    // **FIXED**: Simplified and corrected URL cleanup logic.
    const cleanupURLs = () => {
        if (originalImageForEditor) URL.revokeObjectURL(originalImageForEditor);
        if (imageForPreview && imageForPreview !== originalImageForEditor) {
            URL.revokeObjectURL(imageForPreview);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            cleanupURLs(); // Clean up any and all previous URLs.
            
            const previewUrl = URL.createObjectURL(file);
            
            setImageForSubmission(file);
            setOriginalImageForEditor(previewUrl);
            setImageForPreview(previewUrl);

            // Reset any saved editor state from a previous image.
            setEditorState(null);

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
        onSubmit({ imageFile: imageForSubmission, caption, action });
    };

    // **MODIFIED**: Now receives an object with both the blob and the editor's state.
    const handleCropConfirm = ({ blob, state }) => {
        const croppedFile = new File([blob], "cropped-image.png", { type: "image/png" });
        
        // Clean up the previous preview URL if it was a cropped one.
        if (imageForPreview && imageForPreview !== originalImageForEditor) {
            URL.revokeObjectURL(imageForPreview);
        }

        setImageForSubmission(croppedFile);
        setImageForPreview(URL.createObjectURL(croppedFile));
        
        // **NEW**: Save the received editor state.
        setEditorState(state);

        setViewMode('upload');
    };

    if (viewMode === 'editor') {
        return <CanvasEditor 
                    imagePreview={originalImageForEditor} 
                    onBack={() => setViewMode('upload')} 
                    onConfirm={handleCropConfirm}
                    // **NEW**: Pass the saved state back into the editor.
                    initialState={editorState} 
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
                    {/* ... form controls remain the same ... */}
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
