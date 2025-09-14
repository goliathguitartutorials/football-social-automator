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
import { ManageIcon, AddIcon, RefreshIcon } from './AssetsPageIcons';

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

// Data for the top navigation tabs
const assetTabs = [
    { id: 'manage', label: 'Manage', icon: <ManageIcon /> },
    { id: 'add', label: 'Add New', icon: <AddIcon /> },
];


export default function AssetsPage() {
    const { appData, fetchAppData, authKey } = useAppContext();
    const allAssets = [...(appData.backgrounds || []), ...(appData.badges || [])];

    const [activeTab, setActiveTab] = useState('manage');

    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('Background');
    const [assetFolder, setAssetFolder] = useState('backgrounds/misc');
    const [croppedImage, setCroppedImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');

    const [selectedFolder, setSelectedFolder] = useState('all');

    const groupedAssets = useMemo(() => {
        const groups = allAssets.reduce((acc, asset) => {
            const folder = asset.Folder || 'uncategorized';
            if (!acc[folder]) { acc[folder] = []; }
            acc[folder].push(asset);
            return acc;
        }, {});
        return { all: allAssets, ...groups };
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
            
            formData.append('assetName', assetName);
            formData.append('assetType', assetType);
            formData.append('assetFolder', assetFolder);
            formData.append('file', imageBlob, `${assetName.replace(/\s+/g, '_')}.jpg`);

            const response = await fetch('/api/upload-asset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authKey}` },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to upload asset.');
            
            setMessage('Asset uploaded successfully! Refreshing data...');
            await fetchAppData(authKey);
            setMessage('Asset uploaded and data refreshed!');

            setAssetName(''); setAssetType('Background'); setAssetFolder('backgrounds/misc'); setCroppedImage('');
            setActiveTab('manage');

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.subNav}>
                    {assetTabs.map((tab) => (
                        <button key={tab.id} className={`${styles.navButton} ${activeTab === tab.id ? styles.active : ''}`} onClick={() => setActiveTab(tab.id)}>
                            <span className={styles.navIcon}>{tab.icon}</span>
                            <span className={styles.navLabel}>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </header>
            
            {/* --- MODIFIED: Content is now rendered directly inside the main component --- */}
            <div className={styles.contentArea}>
                {activeTab === 'manage' && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.formGroup}>
                                <label htmlFor="folderFilter">Filter by Folder</label>
                                <select id="folderFilter" value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}>
                                    {folders.map(folder => (<option key={folder} value={folder}>{folder.charAt(0).toUpperCase() + folder.slice(1)}</option>))}
                                </select>
                            </div>
                            <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh all app data"><RefreshIcon /><span>Refresh Data</span></button>
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
                        ) : (<p>No assets found in this folder.</p>)}
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
                                <button type="submit" className={styles.actionButton} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Upload Asset'}</button>
                            </div>
                            {message && <p className={styles.message}>{message}</p>}
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
}
