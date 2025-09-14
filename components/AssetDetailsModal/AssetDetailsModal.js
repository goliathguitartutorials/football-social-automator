/*
 * ==========================================================
 * COMPONENT: Asset Details Modal
 * PAGE: /assets
 * FILE: /components/AssetDetailsModal/AssetDetailsModal.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import styles from './AssetDetailsModal.module.css';
import { CloseIcon, EditIcon, DeleteIcon, CropIcon, SaveIcon } from './AssetDetailsModalIcons';

export default function AssetDetailsModal({ asset, onClose, onManageAsset }) {
    const [currentView, setCurrentView] = useState('details'); // 'details', 'edit_crop', 'edit_name'
    const [newName, setNewName] = useState(asset.Name);
    const [newCroppedImage, setNewCroppedImage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRename = async () => {
        if (!newName || newName === asset.Name) {
            setCurrentView('details');
            return;
        }
        setIsProcessing(true);
        setErrorMessage('');
        const result = await onManageAsset('rename', { assetLink: asset.Link, newName });
        if (!result.success) {
            setErrorMessage(result.error || 'Failed to rename asset.');
        }
        setIsProcessing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this asset?')) {
            setIsProcessing(true);
            setErrorMessage('');
            const result = await onManageAsset('delete', { assetLink: asset.Link });
            if (!result.success) {
                setErrorMessage(result.error || 'Failed to delete asset.');
            }
            // The modal will close automatically on success from the parent component
            setIsProcessing(false);
        }
    };

    const handleRecrop = async () => {
        if (!newCroppedImage) return;
        setIsProcessing(true);
        setErrorMessage('');
        const result = await onManageAsset('recrop', { assetLink: asset.Link, newImageData: newCroppedImage });
        if (!result.success) {
            setErrorMessage(result.error || 'Failed to update image.');
        }
        setIsProcessing(false);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'edit_crop':
                return (
                    <div className={styles.editorContainer}>
                        <h3 className={styles.viewTitle}>Edit Crop</h3>
                        <ImageEditor
                            onCropComplete={(dataUrl) => setNewCroppedImage(dataUrl)}
                            initialImageUrl={asset.Link} // Pass existing image URL
                        />
                        <div className={styles.viewActions}>
                            <button onClick={() => setCurrentView('details')} className={styles.cancelButton}>Cancel</button>
                            <button onClick={handleRecrop} className={styles.confirmButton} disabled={isProcessing || !newCroppedImage}>
                                {isProcessing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                );
            case 'details':
            default:
                return (
                    <>
                        <div className={styles.imageContainer}>
                            <img src={asset.Link} alt={asset.Name} className={styles.assetImage} />
                        </div>
                        <div className={styles.detailsContainer}>
                            <div className={styles.assetNameSection}>
                                {currentView === 'edit_name' ? (
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className={styles.nameInput}
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className={styles.assetName}>{asset.Name}</h2>
                                )}
                                {currentView === 'edit_name' ? (
                                     <button onClick={handleRename} className={styles.actionButton} disabled={isProcessing}>
                                        <SaveIcon /> {isProcessing ? 'Saving...' : 'Save'}
                                    </button>
                                ) : (
                                    <button onClick={() => setCurrentView('edit_name')} className={styles.actionButton}>
                                        <EditIcon /> Rename
                                    </button>
                                )}
                            </div>
                            <p className={styles.assetFolder}><strong>Folder:</strong> {asset.Folder}</p>
                            <div className={styles.assetMeta}>
                                <p><strong>Resolution:</strong> N/A</p>
                                <p><strong>File Type:</strong> N/A</p>
                            </div>
                            <div className={styles.mainActions}>
                                <button onClick={() => setCurrentView('edit_crop')} className={styles.actionButton}>
                                    <CropIcon /> Edit Crop
                                </button>
                                <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isProcessing}>
                                    <DeleteIcon /> {isProcessing ? 'Deleting...' : 'Delete Asset'}
                                </button>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}><CloseIcon /></button>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                <div className={styles.contentGrid}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
