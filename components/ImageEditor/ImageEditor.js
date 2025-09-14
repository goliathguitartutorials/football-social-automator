/*
 * ==========================================================
 * COMPONENT: Image Editor
 * PAGE: (Reusable)
 * FILE: /components/ImageEditor/ImageEditor.js
 * ==========================================================
 */
'use client';

import { useState, useRef, useEffect } from 'react'; // MODIFIED: Added useEffect
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageEditor.module.css';

const ASPECT_RATIO = 1080 / 1350;

// MODIFIED: Component now accepts initialImageUrl prop
export default function ImageEditor({ onCropComplete, initialImageUrl = '' }) {
    const [imgSrc, setImgSrc] = useState(initialImageUrl);
    const [crop, setCrop] = useState();
    const [croppedImageUrl, setCroppedImageUrl] = useState('');
    const [isCropping, setIsCropping] = useState(!!initialImageUrl);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(initialImageUrl ? 'Current Asset' : '');

    // --- NEW: Effect to handle initialImageUrl prop ---
    useEffect(() => {
        if (initialImageUrl) {
            setImgSrc(initialImageUrl);
            setIsCropping(true);
            setCroppedImageUrl(''); // Clear any previous final crop
        }
    }, [initialImageUrl]);

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setCroppedImageUrl('');
        
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

    const handleConfirmCrop = () => {
        if (!imgRef.current || !crop || !crop.width || !crop.height) return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        setCroppedImageUrl(dataUrl);
        setIsCropping(false);

        if (onCropComplete) {
            onCropComplete(dataUrl);
        }
    };

    const resetImage = () => {
        setImgSrc('');
        setCroppedImageUrl('');
        setIsCropping(false);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onCropComplete) {
            onCropComplete(''); 
        }
    };

    return (
        <div className={styles.container}>
            {/* MODIFIED: Logic to show upload state or not */}
            {!imgSrc && !initialImageUrl && (
                <div className={styles.uploadInitialState}>
                    <p className={styles.uploadText}>Upload a Custom Background</p>
                    <input id="custom-bg-upload" ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className={styles.fileInput}/>
                    <label htmlFor="custom-bg-upload" className={styles.uploadButton}>Choose File</label>
                    {fileName && <p className={styles.fileName}>{fileName}</p>}
                </div>
            )}

            {imgSrc && isCropping && (
                <div className={styles.cropperContainer}>
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={ASPECT_RATIO} minWidth={100}>
                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="To be cropped" style={{ maxHeight: '60vh', objectFit: 'contain' }} crossOrigin="anonymous" />
                    </ReactCrop>
                    <button type="button" onClick={handleConfirmCrop} className={styles.utilityButton}>
                        Confirm Crop
                    </button>
                </div>
            )}

            {croppedImageUrl && !isCropping && (
                <div className={styles.previewContainer}>
                    <p>New cropped preview:</p>
                    <img src={croppedImageUrl} alt="Cropped Preview" className={styles.previewImage} />
                    <div className={styles.imageActions}>
                        <button onClick={() => setIsCropping(true)} className={styles.utilityButton}>Re-crop</button>
                        {/* MODIFIED: Don't show "Change Image" when editing an existing asset */}
                        {!initialImageUrl && <button onClick={resetImage} className={styles.utilityButton}>Change Image</button>}
                    </div>
                </div>
            )}
        </div>
    );
}
