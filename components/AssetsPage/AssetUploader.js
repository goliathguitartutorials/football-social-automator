/*
 * ==========================================================
 * COMPONENT: Asset Uploader
 * PAGE: /assets
 * FILE: /components/AssetsPage/AssetUploader.js
 * ==========================================================
 */
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './AssetUploader.module.css';

export default function AssetUploader({ onUploadComplete, aspectRatio, outputWidth, outputHeight }) {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [croppedImageUrl, setCroppedImageUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCroppedImageUrl('');
        
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImgSrc(reader.result?.toString() || '');
            setIsProcessing(true);
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const crop = makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height);
        const centeredCrop = centerCrop(crop, width, height);
        setCrop(centeredCrop);
    };

    const handleConfirm = () => {
        if (!imgRef.current || !crop || !crop.width || !crop.height) return;
        
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error("Failed to get canvas context.");
            return;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0, 0,
            outputWidth,
            outputHeight
        );
        
        const dataUrl = canvas.toDataURL('image/png');
        setCroppedImageUrl(dataUrl);
        setIsProcessing(false);
        if (onUploadComplete) {
            onUploadComplete(dataUrl);
        }
    };

    const reset = () => {
        setImgSrc('');
        setCroppedImageUrl('');
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onUploadComplete) {
            onUploadComplete(''); 
        }
    };

    return (
        <div className={styles.container}>
            {!imgSrc && (
                <div className={styles.initialState}>
                    <input id="asset-upload-input" ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className={styles.fileInput} />
                    <label htmlFor="asset-upload-input" className={styles.uploadButton}>
                        Choose Image File
                    </label>
                </div>
            )}

            {imgSrc && isProcessing && (
                <div className={styles.processingContainer}>
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={aspectRatio} minWidth={100}>
                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Asset to process" style={{ maxHeight: '60vh', objectFit: 'contain' }} />
                    </ReactCrop>
                    <button type="button" onClick={handleConfirm} className={styles.utilityButton}>
                        Confirm Selection
                    </button>
                </div>
            )}

            {croppedImageUrl && !isProcessing && (
                <div className={styles.previewContainer}>
                    <p>Final Preview:</p>
                    <img src={croppedImageUrl} alt="Processed asset preview" className={styles.previewImage} />
                    <button onClick={reset} className={styles.utilityButton}>Change Image</button>
                </div>
            )}
        </div>
    );
}
