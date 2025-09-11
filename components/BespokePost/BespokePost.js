/*
 * ==========================================================
 * COMPONENT: Bespoke Post
 * PAGE: /
 * FILE: /components/BespokePost/BespokePost.js
 ==========================================================
 */
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './BespokePost.module.css';
import { useAppContext } from '@/context/AppContext';

// Aspect ratio for the crop
const ASPECT_RATIO = 1080 / 1350;
const MIN_WIDTH = 400; // Minimum width of the cropper in pixels

export default function BespokePost() {
    const { triggerWorkflow, isLoading } = useAppContext();
    const [text, setText] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [croppedImageUrl, setCroppedImageUrl] = useState('');
    const [error, setError] = useState('');
    const imgRef = useRef(null);

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImgSrc(reader.result?.toString() || '');
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const cropWidth = (MIN_WIDTH / width) * 100;

        const crop = makeAspectCrop(
            {
                unit: '%',
                width: cropWidth,
            },
            ASPECT_RATIO,
            width,
            height
        );
        const centeredCrop = centerCrop(crop, width, height);
        setCrop(centeredCrop);
    };

    const getCroppedImg = () => {
        if (!imgRef.current || !crop || !crop.width || !crop.height) {
            return null;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );
        // Returns the image data as a Base64 string
        return canvas.toDataURL('image/jpeg', 0.9);
    };

    const handleGeneratePreview = () => {
        const croppedDataUrl = getCroppedImg();
        if (croppedDataUrl) {
            setCroppedImageUrl(croppedDataUrl);
        } else {
            setError('Could not generate cropped image. Please try again.');
        }
    };
    
    const handlePost = async () => {
        setError('');
        const imageData = croppedImageUrl || getCroppedImg();

        if (!imageData) {
            setError('Please upload and crop an image first.');
            return;
        }
        if (!text.trim()) {
            setError('Please enter some text for the post.');
            return;
        }
        
        const payload = {
            action: 'bespoke_post',
            text: text,
            imageData: imageData, // Send Base64 image data
        };

        await triggerWorkflow(payload);
        // Optionally clear fields on success
        // setText('');
        // setImgSrc('');
        // setCroppedImageUrl('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.formSection}>
                <h2>Create a Bespoke Post</h2>

                <label htmlFor="postText" className={styles.label}>Post Text</label>
                <textarea
                    id="postText"
                    className={styles.textarea}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your caption here..."
                    rows={5}
                />

                <label htmlFor="imageUpload" className={styles.label}>Upload Image</label>
                <input id="imageUpload" type="file" accept="image/*" onChange={onSelectFile} className={styles.fileInput} />

                {imgSrc && (
                    <>
                        <p className={styles.instructions}>Adjust the selection to crop your image (1080x1350 ratio).</p>
                        <div className={styles.cropperContainer}>
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                aspect={ASPECT_RATIO}
                                minWidth={100}
                            >
                                <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="To be cropped" style={{ maxHeight: '70vh' }} />
                            </ReactCrop>
                        </div>
                        <button onClick={handleGeneratePreview} className={styles.previewButton}>Generate Preview</button>
                    </>
                )}
            </div>

            <div className={styles.previewSection}>
                <h3>Post Preview</h3>
                {croppedImageUrl ? (
                     <div className={styles.previewContent}>
                        <img src={croppedImageUrl} alt="Cropped Preview" className={styles.previewImage} />
                        <p className={styles.previewText}>{text || "Your caption will appear here."}</p>
                     </div>
                ) : (
                    <p className={styles.placeholder}>Your cropped image and text will be previewed here.</p>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <button onClick={handlePost} disabled={isLoading || !croppedImageUrl} className={styles.postButton}>
                    {isLoading ? 'Posting...' : 'Post to Social Media'}
                </button>
            </div>
        </div>
    );
}
