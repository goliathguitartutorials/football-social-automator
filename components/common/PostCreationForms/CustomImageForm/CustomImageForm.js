/*
 * ==========================================================
 * COMPONENT: CustomImageForm
 * PAGE: Create Post, Schedule Post
 * FILE: /components/common/PostCreationForms/CustomImageForm/CustomImageForm.js
 * ==========================================================
 */
'use client';
import { useState, useRef } from 'react';
import styles from './CustomImageForm.module.css';
import { UploadIcon, EditIcon, ScheduleIcon, PostNowIcon } from './CustomImageFormIcons';

export default function CustomImageForm({ context = 'schedule', onSubmit, isSubmitting }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            setImageFile(file);
            // Revoke the old object URL to prevent memory leaks
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else if (file) {
            alert("Please upload a valid image file (PNG or JPG).");
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // This function is now called by the action buttons
    const handleFormSubmit = (action) => {
        if (!imageFile) {
            alert("Please upload an image before submitting.");
            return;
        }
        // The onSubmit prop is passed down from CreatePostView.js
        onSubmit({
            imageFile,
            caption,
            action: action // 'schedule' or 'post_now'
        });
    };

    // Render the initial upload area
    const renderUploadView = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Image</h3>
            </div>
            <div className={styles.uploadArea} onClick={triggerFileInput} role="button" tabIndex={0} onKeyPress={triggerFileInput}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                />
                <div className={styles.uploadIcon}><UploadIcon /></div>
                <p className={styles.uploadText}>Click to upload an image</p>
                <p className={styles.uploadSubtext}>PNG or JPG</p>
            </div>
        </div>
    );

    // Render the two-column preview and edit layout
    const renderPreviewView = () => (
        <div className={styles.previewLayout}>
            <div className={styles.previewImageWrapper}>
                <img src={imagePreview} alt="Post preview" className={styles.previewImage} />
            </div>
            <div className={styles.previewControls}>
                {/* Section for editing the image */}
                <div className={styles.previewSection}>
                     <div className={styles.sectionHeader}>
                        <label className={styles.sectionTitle}>Final Image</label>
                    </div>
                    <button type="button" className={styles.actionButton_FullWidth} onClick={() => alert('Editor view to be implemented!')}>
                        <EditIcon /> Adjust Canvas
                    </button>
                    <button type="button" className={styles.actionButton_Secondary} onClick={triggerFileInput}>
                        Change Image
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" style={{ display: 'none' }}/>
                </div>

                {/* Section for the caption */}
                <div className={styles.previewSection}>
                    <div className={styles.sectionHeader}>
                        <label htmlFor="caption" className={styles.sectionTitle}>Post Caption</label>
                    </div>
                    <textarea
                        id="caption"
                        className={styles.captionTextarea}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write your caption here..."
                        rows={8}
                    />
                </div>

                {/* Section for the final actions */}
                <div className={`${styles.previewSection} ${styles.actionsSection}`}>
                    {context === 'create' && (
                        <button type="button" onClick={() => handleFormSubmit('post_now')} disabled={isSubmitting} className={styles.actionButton_PostNow}>
                            <PostNowIcon />
                            {isSubmitting ? 'Posting...' : 'Post Now'}
                        </button>
                    )}
                    <button type="button" onClick={() => handleFormSubmit('schedule')} disabled={isSubmitting} className={styles.actionButton_Schedule}>
                        <ScheduleIcon />
                        {isSubmitting ? 'Scheduling...' : (context === 'create' ? 'Schedule for Later' : 'Schedule Post')}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <form className={styles.formContainer} onSubmit={(e) => e.preventDefault()}>
            {!imagePreview ? renderUploadView() : renderPreviewView()}
        </form>
    );
}
