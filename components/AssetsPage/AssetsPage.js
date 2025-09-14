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
import { ManageIcon, AddIcon, RefreshIcon, FolderIcon, HomeIcon } from './AssetsPageIcons';

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

    // --- MODIFIED: State for new directory navigation ---
    const [currentPath, setCurrentPath] = useState('');

    // --- NEW: Build a nested directory tree from the flat asset list ---
    const directoryTree = useMemo(() => {
        const tree = {};
        allAssets.forEach(asset => {
            const pathParts = (asset.Folder || 'uncategorized').split('/').filter(p => p);
            let currentNode = tree;
            pathParts.forEach(part => {
                if (!currentNode[part]) {
                    currentNode[part] = { '__assets': [] };
                }
                currentNode = currentNode[part];
            });
            currentNode['__assets'].push(asset);
        });
        return tree;
    }, [allAssets]);

    // --- NEW: Determine what to display based on the currentPath ---
    const currentView = useMemo(() => {
        const pathParts = currentPath.split('/').filter(p => p);
        let currentNode = directoryTree;
        for (const part of pathParts) {
            currentNode = currentNode[part] || { '__assets': [] };
        }

        const subfolders = Object.keys(currentNode).filter(key => key !== '__assets');
        const assets = currentNode['__assets'] || [];

        return { subfolders, assets, breadcrumbs: pathParts };
    }, [currentPath, directoryTree]);


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

    // --- NEW: Handlers for directory navigation ---
    const handleFolderClick = (folder) => {
        setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder);
    };

    const handleBreadcrumbClick = (index) => {
        if (index < 0) { // Home button
            setCurrentPath('');
        } else {
            const newPath = currentView.breadcrumbs.slice(0, index + 1).join('/');
            setCurrentPath(newPath);
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
            
            <div className={styles.contentArea}>
                {activeTab === 'manage' && (
                    <section className={styles.section}>
                        {/* --- MODIFIED: Section header with breadcrumbs --- */}
                        <div className={styles.sectionHeader}>
                            <nav className={styles.breadcrumbs}>
                                <button onClick={() => handleBreadcrumbClick(-1)} title="Go to root folder">
                                    <HomeIcon />
                                </button>
                                {currentView.breadcrumbs.map((part, index) => (
                                    <span key={index}>
                                        <span className={styles.breadcrumbSeparator}>/</span>
                                        <button onClick={() => handleBreadcrumbClick(index)}>{part}</button>
                                    </span>
                                ))}
                            </nav>
                            <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh all app data"><RefreshIcon /><span>Refresh Data</span></button>
                        </div>

                        {/* --- NEW: Display for subfolders --- */}
                        {currentView.subfolders.length > 0 && (
                            <div className={styles.folderGrid}>
                                {currentView.subfolders.map(folder => (
                                    <button key={folder} className={styles.folderItem} onClick={() => handleFolderClick(folder)}>
                                        <FolderIcon />
                                        <span className={styles.folderName}>{folder}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* --- MODIFIED: Display for assets in the current path --- */}
                        {currentView.assets.length > 0 && (
                            <div className={styles.assetGrid}>
                                {currentView.assets.map(asset => (
                                    <div key={asset.Link} className={styles.assetItem}>
                                        <img src={asset.Link} alt={asset.Name} className={styles.assetImage} />
                                        <div className={styles.assetInfo}>
                                            <p className={styles.assetName}>{asset.Name}</p>
                                            <p className={styles.assetFolder}>{asset.Folder}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* --- NEW: Message for empty folders --- */}
                        {currentView.subfolders.length === 0 && currentView.assets.length === 0 && (
                            <p className={styles.emptyMessage}>This folder is empty.</p>
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
