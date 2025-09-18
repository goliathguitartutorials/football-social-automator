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
    const [view, setView] = useState('UPLOAD'); // UPLOAD, EDITOR
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else {
            // Handle invalid file type
            alert("Please upload a valid image file (PNG or JPG).");
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Placeholder for future submit logic
        console.log("Submitting:", { imageFile, caption, context });
        // In the future, we will construct FormData here and call onSubmit
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            {/* Step 1: Image Upload & Preview */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Image</h3>
                </div>
                {!imagePreview ? (
                    <div className={styles.uploadArea} onClick={triggerFileInput} role="button" tabIndex={0}>
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
                ) : (
                    <div className={styles.previewContainer}>
                        <div className={styles.imageWrapper}>
                            <img src={imagePreview} alt="Image preview" className={styles.previewImage} />
                        </div>
                        <div className={styles.previewActions}>
                            <button type="button" className={styles.editButton} onClick={() => alert('Editor view to be implemented!')}>
                                <EditIcon /> Adjust Canvas
                            </button>
                            <button type="button" className={styles.changeButton} onClick={triggerFileInput}>
                                Change Image
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/png, image/jpeg"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Caption */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Post Caption</h3>
                </div>
                <textarea
                    id="caption"
                    className={styles.captionTextarea}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    rows={6}
                />
            </div>

            {/* Step 3: Actions */}
            <div className={styles.actionsContainer}>
                {context === 'create' && (
                    <button type="submit" name="post_now" disabled={isSubmitting || !imageFile} className={styles.actionButton_PostNow}>
                        <PostNowIcon />
                        {isSubmitting ? 'Posting...' : 'Post Now'}
                    </button>
                )}
                <button type="submit" name="schedule" disabled={isSubmitting || !imageFile} className={styles.actionButton_Schedule}>
                    <ScheduleIcon />
                    {isSubmitting ? 'Scheduling...' : (context === 'create' ? 'Schedule for Later' : 'Schedule Post')}
                </button>
            </div>
        </form>
    );
}
