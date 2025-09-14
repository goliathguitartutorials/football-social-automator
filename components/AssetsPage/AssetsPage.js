/*
 * ==========================================================
 * COMPONENT: Assets Page
 * PAGE: /assets
 * FILE: /components/AssetsPage/AssetsPage.js
 * ==========================================================
 */
'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import ImageEditor from '@/components/ImageEditor/ImageEditor';
import styles from './AssetsPage.module.css';

// Helper function to convert Data URL to a Blob for file upload
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

// --- NEW: SVG Icons for Tabs ---
const ManageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);


export default function AssetsPage() {
    const { appData, fetchAppData, authKey } = useAppContext();
    const allAssets = [...(appData.backgrounds || []), ...(appData.badges || [])];

    // MODIFIED: State for active tab
    const [activeTab, setActiveTab] = useState('manage');

    // State for the upload form
    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('Background');
    const [assetFolder, setAssetFolder] = useState('backgrounds/misc');
    const [croppedImage, setCroppedImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');

    // State for viewing assets
    const [selectedFolder, setSelectedFolder] = useState('all');

    const groupedAssets = useMemo(() => {
        const groups = allAssets.reduce((acc, asset) => {
            const folder = asset.Folder || 'uncategorized';
            if (!acc[folder]) {
                acc[folder] = [];
            }
            acc[folder].push(asset);
            return acc;
        }, {});
        return {
            all: allAssets,
            ...groups
        };
    }, [allAssets]);

    const folders = useMemo(() => Object.keys(groupedAssets).sort(), [groupedAssets]);
    const assetsToDisplay = groupedAssets[selectedFolder] || [];

    const handleRefresh = async () => {
        await fetchAppData(authKey);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!croppedImage || !assetName || !assetType || !assetFolder) {
            setMessage('Please fill out all fields and select an image.');
            return;
        }
        setIsUploading(true);
        setMessage('');

        try {
            const imageBlob = dataURLtoBlob(croppedImage);
            const formData = new FormData();
            
            formData.append('action', 'add_asset');
            formData.append('assetName', assetName);
            formData.append('assetType', assetType);
            formData.append('assetFolder', assetFolder);
            formData.append('file', imageBlob, `${assetName.replace(/\s+/g, '_')}.jpg`);

            const response = await fetch('/api/trigger-workflow', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authKey}` },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to upload asset.');
            }
            
            setMessage('Asset uploaded successfully! Refreshing data...');
            await fetchAppData(authKey);
            setMessage('Asset uploaded and data refreshed!');

            // Reset form and switch back to manage tab
            setAssetName('');
            setAssetType('Background');
            setAssetFolder('backgrounds/misc');
            setCroppedImage('');
            setActiveTab('manage');

        } catch (err) {
            setMessage(`Error: ${err.message}`);
            console.error('Asset Upload Error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Asset Manager</h2>
                <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh all app data">
                    <RefreshIcon />
                    <span>Refresh Data</span>
                </button>
            </header>
            
            {/* --- NEW: Tab Navigation --- */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
                    onClick={() => setActiveTab('manage')}
                >
                    <ManageIcon />
                    <span>Manage Assets</span>
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'add' ? styles.active : ''}`}
                    onClick={() => setActiveTab('add')}
                >
                    <AddIcon />
                    <span>Add New Asset</span>
                </button>
            </div>

            {/* --- MODIFIED: Conditional Rendering based on activeTab --- */}
            {activeTab === 'manage' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>View Assets</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="folderFilter">Filter by Folder</label>
                            <select id="folderFilter" value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}>
                                {folders.map(folder => (
                                    <option key={folder} value={folder}>{folder.charAt(0).toUpperCase() + folder.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {assetsToDisplay.length > 0 ? (
                        <div className={styles.assetGrid}>
                            {assetsToDisplay.map(asset => (
                                <div key={asset.Link} className={styles.assetItem}>
                                    <img src={asset.Link} alt={asset.Name} className={styles.assetImage} />
                                    <div className={styles.assetInfo}>
                                        <p className={styles.assetName}>{asset.Name}</p>
                                        <p className={styles.assetFolder}>{asset.Folder}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No assets found in this folder.</p>
                    )}
                </section>
            )}

            {activeTab === 'add' && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Add New Asset</h3>
                    <form onSubmit={handleUpload} className={styles.uploadForm}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="assetName">Asset Name</label>
                                <input type="text" id="assetName" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g., Player Goal Celebration" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="assetType">Asset Type</label>
                                <select id="assetType" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                                    <option value="Background">Background</option>
                                    <option value="Badge">Badge</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="assetFolder">Folder</label>
                                <input type="text" id="assetFolder" value={assetFolder} onChange={(e) => setAssetFolder(e.target.value)} placeholder="e.g., backgrounds/first-team" required />
                            </div>
                        </div>
                        <div className={styles.imageEditorContainer}>
                            <ImageEditor onCropComplete={(dataUrl) => setCroppedImage(dataUrl)} />
                        </div>
                        <div className={styles.actionsContainer}>
                            <button type="submit" className={styles.actionButton} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : 'Upload Asset'}
                            </button>
                        </div>
                         {message && <p className={styles.message}>{message}</p>}
                    </form>
                </section>
            )}
        </div>
    );
}
