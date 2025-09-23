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
import { UploadIcon, EditIcon, ScheduleIcon, PostNowIcon, GenerateIcon } from './CustomImageFormIcons';

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
    timeSlots,
    authKey 
}) {
    const [imageForSubmission, setImageForSubmission] = useState(null);
    const [imageForPreview, setImageForPreview] = useState('');
    const [originalImageForEditor, setOriginalImageForEditor] = useState('');
    const [editorState, setEditorState] = useState(null);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('upload');

    // New state for AI Assistant
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    const cleanupURLs = () => {
        if (originalImageForEditor) URL.revokeObjectURL(originalImageForEditor);
        if (imageForPreview && imageForPreview !== originalImageForEditor) {
            URL.revokeObjectURL(imageForPreview);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            cleanupURLs();
            const previewUrl = URL.createObjectURL(file);
            setImageForSubmission(file);
            setOriginalImageForEditor(previewUrl);
            setImageForPreview(previewUrl);
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

    const handleCropConfirm = ({ blob, state }) => {
        const croppedFile = new File([blob], "cropped-image.png", { type: "image/png" });
        if (imageForPreview && imageForPreview !== originalImageForEditor) {
            URL.revokeObjectURL(imageForPreview);
        }
        setImageForSubmission(croppedFile);
        setImageForPreview(URL.createObjectURL(croppedFile));
        setEditorState(state);
        setViewMode('upload');
    };

    const handleGenerateCaption = async () => {
        if (!aiPrompt.trim()) {
            alert('Please enter a prompt for the AI.');
            return;
        }
        setIsGeneratingCaption(true);
        const payload = {
            page: 'customImage',
            gameInfo: { prompt: aiPrompt }
        };

        try {
            const response = await fetch('/api/generate-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to generate caption.');
            const result = await response.json();
            setCaption(result.caption || 'Sorry, could not generate a caption.');
        } catch (err) {
            setCaption(`Error: ${err.message}`);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    if (viewMode === 'editor') {
        return <CanvasEditor
                    imagePreview={originalImageForEditor}
                    onBack={() => setViewMode('upload')}
                    onConfirm={handleCropConfirm}
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
                    <div className={styles.controlSection}>
                        <label htmlFor="caption" className={styles.sectionLabel}>Post Caption</label>
                        <textarea id="caption" className={styles.captionTextarea} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption here, or generate one with AI..." rows={5} />
                        
                        <button type="button" className={styles.aiToggleButton} onClick={() => setShowAiAssistant(prev => !prev)}>
                            {showAiAssistant ? 'Hide AI Assistant' : 'Generate with AI'}
                        </button>

                        {showAiAssistant && (
                            <div className={styles.aiAssistantSection}>
                                <label htmlFor="aiPrompt" className={styles.sectionLabel_Small}>Instructions for AI</label>
                                <textarea
                                    id="aiPrompt"
                                    className={styles.promptTextarea}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g., A happy birthday post for John Doe..."
                                    rows={3}
                                />
                                <button type="button" className={styles.actionButton_FullWidth} onClick={handleGenerateCaption} disabled={isGeneratingCaption}>
                                    <GenerateIcon />
                                    {isGeneratingCaption ? 'Generating...' : 'Generate Caption'}
                                </button>
                            </div>
                        )}
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
                    
                    {context === 'create' ? (
                        <>
                            <div className={styles.controlSection}>
                                <button type="button" onClick={() => handleFormSubmit('post_now')} disabled={isSubmitting || !imageForSubmission} className={styles.actionButton_PostNow}>
                                    <PostNowIcon />
                                    {isSubmitting ? 'Posting...' : 'Post Now'}
                                </button>
                            </div>
                            
                            <div className={styles.scheduleSection}>
                                <h3 className={styles.scheduleHeader}>Schedule for Later</h3>
                                <div className={styles.dateTimeInputs}>
                                    <div className={styles.inputGroup}><label htmlFor="schedule-date-form">Date</label><input id="schedule-date-form" type="date" value={selectedDate} onChange={onDateChange} /></div>
                                    <div className={styles.inputGroup}><label htmlFor="schedule-time-form">Time</label><select id="schedule-time-form" value={selectedTime} onChange={onTimeChange}>{timeSlots.map(time => <option key={time} value={time}>{time}</option>)}</select></div>
                                </div>
                                <button type="button" onClick={() => handleFormSubmit('schedule')} disabled={isSubmitting || !imageForSubmission} className={styles.actionButton_Schedule}>
                                    <ScheduleIcon />
                                    {isSubmitting ? 'Scheduling...' : 'Schedule for Later'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.controlSection}>
                                <label className={styles.sectionLabel}>Schedule for...</label>
                                <div className={styles.dateTimeInputs}>
                                    <div className={styles.inputGroup}><label htmlFor="schedule-date-form">Date</label><input id="schedule-date-form" type="date" value={selectedDate} onChange={onDateChange} /></div>
                                    <div className={styles.inputGroup}><label htmlFor="schedule-time-form">Time</label><select id="schedule-time-form" value={selectedTime} onChange={onTimeChange}>{timeSlots.map(time => <option key={time} value={time}>{time}</option>)}</select></div>
                                </div>
                            </div>
                            <div className={`${styles.controlSection} ${styles.finalActions}`}>
                                <button type="button" onClick={() => handleFormSubmit('schedule')} disabled={isSubmitting || !imageForSubmission} className={styles.actionButton_Schedule}>
                                    <ScheduleIcon />
                                    {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}
