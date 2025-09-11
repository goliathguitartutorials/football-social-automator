/*
 * ==========================================================
 * COMPONENT: Bespoke Post
 * PAGE: / (as part of CreatePage)
 * FILE: /components/BespokePost/BespokePost.js
 ==========================================================
 */
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './BespokePost.module.css';
import { useAppContext } from '@/app/context/AppContext';

const ASPECT_RATIO = 1080 / 1350;
const MIN_WIDTH = 400;

export default function BespokePost() {
    const { authKey } = useAppContext();
    const [text, setText] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [croppedImageBlob, setCroppedImageBlob] = useState(null); // Store the binary Blob
    const [previewUrl, setPreviewUrl] = useState(''); // For the UI preview
    const [isCropping, setIsCropping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCroppedImageBlob(null);
        setPreviewUrl('');
        setMessage('');

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImgSrc(reader.result?.toString() || '');
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const crop = makeAspectCrop({ unit: '%', width: 90 }, ASPECT_RATIO, width, height);
        const centeredCrop = centerCrop(crop, width, height);
        setCrop(centeredCrop);
    };

    // This function now returns a Promise that resolves with the image Blob
    const getCroppedImgBlob = () => {
        return new Promise((resolve) => {
            if (!imgRef.current || !crop || !crop.width || !crop.height) {
                resolve(null);
                return;
            }
            const image = imgRef.current;
            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width * scaleX;
            canvas.height = crop.height * scaleY;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }
            ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    };

    const handleConfirmCrop = async () => {
        const blob = await getCroppedImgBlob();
        if (blob) {
            setCroppedImageBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob)); // Create a temporary URL for the preview
            setIsCropping(false);
        }
    };
    
    const handlePost = async () => {
        if (!authKey) return setMessage('Authorization Key is missing. Please set it on the Settings page.');
        if (!croppedImageBlob) return setMessage('Please upload and crop an image.');
        if (!text.trim()) return setMessage('Please enter some text for the caption.');

        setIsSubmitting(true);
        setMessage('');

        const formData = new FormData();
        formData.append('action', 'bespoke_post');
        formData.append('text', text);
        formData.append('imageFile', croppedImageBlob, 'bespoke-post.jpg'); // Append the binary file

        try {
            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: {
                    // NOTE: DO NOT set Content-Type header. The browser will do it automatically for FormData.
                    'Authorization': `Bearer ${authKey}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to post to social media.');

            setMessage('Successfully posted to social media!');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
            console.error('Post to Social Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const resetImage = () => {
        setImgSrc('');
        setCroppedImageBlob(null);
        setPreviewUrl('');
        setIsCropping(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    // Render logic remains similar, but uses previewUrl
    return (
        <div className={styles.container}>
            <h2>Create a Bespoke Post</h2>

            {/* --- Image Section --- */}
            <div className={styles.imageSection}>
                {!imgSrc && (
                    <div className={styles.uploadPlaceholder}>
                        <p>Upload an image to get started</p>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} />
                    </div>
                )}

                {imgSrc && isCropping && (
                    <div className={styles.cropperContainer}>
                        <p className={styles.instructions}>Adjust the selection to crop your image (1080x1350 ratio).</p>
                        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={ASPECT_RATIO} minWidth={100}>
                            <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="To be cropped" style={{ maxHeight: '60vh' }} />
                        </ReactCrop>
                        <button onClick={handleConfirmCrop} className={styles.primaryButton}>Confirm Crop</button>
                    </div>
                )}
                
                {previewUrl && !isCropping && (
                     <div className={styles.previewContainer}>
                        <img src={previewUrl} alt="Cropped Preview" className={styles.previewImage} />
                        <div className={styles.imageActions}>
                            <button onClick={() => setIsCropping(true)} className={styles.secondaryButton}>Re-crop</button>
                            <button onClick={resetImage} className={styles.secondaryButton}>Change Image</button>
                        </div>
                     </div>
                )}
            </div>

            {/* --- Text & Action Section --- */}
            <div className={styles.formSection}>
                 <label htmlFor="postText" className={styles.label}>Post Caption</label>
                <textarea
                    id="postText"
                    className={styles.textarea}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your caption here..."
                    rows={6}
                />
                <button onClick={handlePost} disabled={isSubmitting || !croppedImageBlob} className={styles.postButton}>
                    {isSubmitting ? 'Posting...' : 'Post to Social Media'}
                </button>
                {message && <p className={styles.message}>{message}</p>}
            </div>
        </div>
    );
}
