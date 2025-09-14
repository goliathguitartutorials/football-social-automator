/*
 * ==========================================================
 * COMPONENT: Asset Details Modal
 * PAGE: /assets
 * FILE: /components/AssetDetailsModal/AssetDetailsModal.js
 * ==========================================================
 */
'use client';

import { useState } from 'react';
import styles from './AssetDetailsModal.module.css';
import { CloseIcon, EditIcon, DeleteIcon, SaveIcon } from './AssetDetailsModalIcons';

export default function AssetDetailsModal({ asset, onClose, onManageAsset }) {
    const [currentView, setCurrentView] = useState('details'); // 'details', 'edit_name', 'confirm_delete'
    const [newName, setNewName] = useState(asset.Name);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRename = async () => {
        if (!newName || newName === asset.Name) {
            setCurrentView('details');
            return;
        }
        setIsProcessing(true);
        setErrorMessage('');
        // The asset.Link contains the unique URL which is tied to the OrshotFileName
        const result = await onManageAsset('rename', { assetLink: asset.Link, newName });
        if (result.success) {
            setCurrentView('details'); 
        } else {
            setErrorMessage(result.error || 'Failed to rename asset.');
        }
        setIsProcessing(false);
    };

    const handleDelete = async () => {
        setIsProcessing(true);
        setErrorMessage('');
        const result = await onManageAsset('delete', { assetLink: asset.Link });
        if (!result.success) {
            setErrorMessage(result.error || 'Failed to delete asset.');
            setIsProcessing(false);
            setCurrentView('details'); // Go back to details view on error
        }
        // On success, the parent component closes the modal.
    };
    
    // --- Renders the main content of the modal based on the current view ---
    const renderContent = () => {
        // --- NEW: Custom delete confirmation view ---
        if (currentView === 'confirm_delete') {
            return (
                <div className={styles.confirmationView}>
                    <h3 className={styles.viewTitle}>Confirm Deletion</h3>
                    <p>Are you sure you want to permanently delete this asset?</p>
                    <p className={styles.assetNameConfirm}><strong>{asset.Name}</strong></p>
                    <div className={styles.viewActions}>
                        <button onClick={() => setCurrentView('details')} className={styles.cancelButton} disabled={isProcessing}>
                            Cancel
                        </button>
                        <button onClick={handleDelete} className={`${styles.confirmButton} ${styles.deleteButton}`} disabled={isProcessing}>
                            {isProcessing ? 'Deleting...' : 'Yes, Delete Asset'}
                        </button>
                    </div>
                </div>
            );
        }

        // --- Default details view ---
        return (
            <div className={styles.contentGrid}>
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
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
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
                        <p><strong>Orshot File:</strong> {asset.Link.split('/').pop()}</p>
                    </div>
                    <div className={styles.mainActions}>
                        {/* MODIFIED: Delete button now switches to the confirmation view */}
                        <button onClick={() => setCurrentView('confirm_delete')} className={`${styles.actionButton} ${styles.deleteButtonAction}`} disabled={isProcessing}>
                            <DeleteIcon /> Delete Asset
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}><CloseIcon /></button>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                {renderContent()}
            </div>
        </div>
    );
}
