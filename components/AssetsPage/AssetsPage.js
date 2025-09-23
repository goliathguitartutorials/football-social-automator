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
import AssetUploader from './AssetUploader';
import Breadcrumbs from './Breadcrumbs'; // MODIFIED: Import the new Breadcrumbs component
import AssetDetailsModal from '@/components/AssetDetailsModal/AssetDetailsModal';
import styles from './AssetsPage.module.css';
import { ManageIcon, AddIcon, RefreshIcon, FolderIcon, HomeIcon } from './AssetsPageIcons';

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

const ASSET_TYPES = {
    background: { label: 'Background', aspect: 1080 / 1350, width: 1080, height: 1350 },
    badge: { label: 'Badge', aspect: 1 / 1, width: 1080, height: 1080 },
};

const assetTabs = [
    { id: 'manage', label: 'Manage', icon: <ManageIcon /> },
    { id: 'add', label: 'Add New', icon: <AddIcon /> },
];

export default function AssetsPage() {
    const { appData, refreshAppData, authKey } = useAppContext();
    const allAssets = [...(appData.backgrounds || []), ...(appData.badges || [])];

    const [activeTab, setActiveTab] = useState('manage');
    const [message, setMessage] = useState('');
    
    const [currentPath, setCurrentPath] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newAssetName, setNewAssetName] = useState('');
    const [uploadAssetType, setUploadAssetType] = useState('background');
    const [processedImage, setProcessedImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPath, setUploadPath] = useState('');
    
    // MODIFIED: State for new in-line folder creation
    const [destinationFolder, setDestinationFolder] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const directoryTree = useMemo(() => {
        const tree = {};
        allAssets.forEach(asset => {
            const pathParts = (asset.Folder || '').split('/').filter(p => p);
            let currentNode = tree;
            pathParts.forEach(part => { if (!currentNode[part]) { currentNode[part] = { '__assets': [] }; } currentNode = currentNode[part]; });
            currentNode['__assets'].push(asset);
        });
        return tree;
    }, [allAssets]);

    const createViewFromPath = (path, tree) => {
        const pathParts = path.split('/').filter(p => p);
        let currentNode = tree;
        for (const part of pathParts) { currentNode = currentNode[part] || { '__assets': [] }; }
        const subfolders = Object.keys(currentNode).filter(key => key !== '__assets');
        const assets = currentNode['__assets'] || [];
        return { subfolders, assets };
    };

    const manageView = useMemo(() => createViewFromPath(currentPath, directoryTree), [currentPath, directoryTree]);
    const uploadFolderView = useMemo(() => createViewFromPath(uploadPath, directoryTree), [uploadPath, directoryTree]);
    
    const handleRefresh = async () => { await refreshAppData(); };
    const handleAssetClick = (asset) => { setSelectedAsset(asset); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedAsset(null); };

    const handleManageAsset = async (action, payload) => {
        try {
            const response = await fetch('/api/manage-asset', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authKey}` }, body: JSON.stringify({ action, ...payload }), });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to manage asset.');
            await refreshAppData();
            handleCloseModal();
            return { success: true };
        } catch (err) {
            console.error(`Error performing '${action}':`, err);
            return { success: false, error: err.message };
        }
    };
    
    // MODIFIED: Logic to handle creating and selecting a new folder
    const handleCreateAndSelectFolder = () => {
        if (!newFolderName.trim()) {
            setIsCreatingFolder(false);
            return;
        }
        const finalPath = uploadPath ? `${uploadPath}/${newFolderName.trim()}` : newFolderName.trim();
        setDestinationFolder(finalPath);
        setIsCreatingFolder(false);
        setNewFolderName('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        // MODIFIED: Use the explicitly selected destinationFolder or the current uploadPath
        const finalDestination = destinationFolder || uploadPath;
        if (!processedImage || !newAssetName || finalDestination === null) {
            setMessage('Please select a destination folder.');
            return;
        }
        setIsUploading(true);
        setMessage('');

        try {
            const imageBlob = dataURLtoBlob(processedImage);
            const formData = new FormData();
            formData.append('assetName', newAssetName);
            formData.append('assetType', ASSET_TYPES[uploadAssetType].label);
            formData.append('assetFolder', finalDestination);
            formData.append('file', imageBlob, `${newAssetName.replace(/\s+/g, '_')}.png`);

            const response = await fetch('/api/upload-asset', { method: 'POST', headers: { 'Authorization': `Bearer ${authKey}` }, body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to upload asset.');
            
            setMessage('Asset uploaded successfully! Refreshing...');
            await refreshAppData();
            setMessage('Asset uploaded and data refreshed!');
            
            setNewAssetName(''); setProcessedImage(''); setUploadPath(''); setDestinationFolder(''); setActiveTab('manage');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // MODIFIED: Centralized navigation handlers
    const handleManageNav = (index) => {
        const pathParts = currentPath.split('/').filter(p => p);
        if (index < 0) { setCurrentPath(''); } else { setCurrentPath(pathParts.slice(0, index + 1).join('/')); }
    };
    
    const handleUploadNav = (index) => {
        const pathParts = uploadPath.split('/').filter(p => p);
        if (index < 0) { setUploadPath(''); } else { setUploadPath(pathParts.slice(0, index + 1).join('/')); }
        setDestinationFolder(''); // Reset specific destination on navigation
    };

    return (
        <>
            {isModalOpen && selectedAsset && ( <AssetDetailsModal asset={selectedAsset} onClose={handleCloseModal} onManageAsset={handleManageAsset} /> )}
            <div className={styles.container}>
                <header className={styles.header}>
                    <nav className={styles.subNav}>
                        {assetTabs.map((tab) => ( <button key={tab.id} className={`${styles.navButton} ${activeTab === tab.id ? styles.active : ''}`} onClick={() => setActiveTab(tab.id)}> <span className={styles.navIcon}>{tab.icon}</span> <span className={styles.navLabel}>{tab.label}</span> </button> ))}
                    </nav>
                </header>
                <div className={styles.contentArea}>
                    {activeTab === 'manage' && (
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                {/* MODIFIED: Use the new Breadcrumbs component */}
                                <Breadcrumbs path={currentPath} onNavigate={handleManageNav} />
                            </div>

                            {manageView.subfolders.length > 0 && (
                                <div className={styles.folderGrid}>
                                    {manageView.subfolders.map(folder => (
                                        <button key={folder} className={styles.folderItem} onClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder)}>
                                            <FolderIcon />
                                            <span className={styles.folderName}>{folder}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {manageView.assets.length > 0 && (
                                <div className={styles.assetGrid}>
                                    {manageView.assets.map(asset => (
                                        <button key={asset.Link} className={styles.assetItemButton} onClick={() => handleAssetClick(asset)}>
                                            <img src={asset.Link} alt={asset.Name} className={styles.assetImage} />
                                            <div className={styles.assetInfo}>
                                                <p className={styles.assetName}>{asset.Name}</p>
                                                <p className={styles.assetFolder}>{asset.Folder}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {manageView.subfolders.length === 0 && manageView.assets.length === 0 && (
                                <p className={styles.emptyMessage}>This folder is empty.</p>
                            )}

                            <div className={styles.footerActions}>
                                <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh all app data">
                                    <RefreshIcon />
                                    <span>Refresh App Data</span>
                                </button>
                            </div>
                        </section>
                    )}
                    {activeTab === 'add' && (
                        <section className={styles.section}>
                            <div className={styles.uploadStep}>
                                <h3 className={styles.stepTitle}>Step 1: Choose Asset Type</h3>
                                <div className={styles.assetTypeSelector}>
                                    {Object.entries(ASSET_TYPES).map(([key, { label, width, height }]) => (
                                        <button key={key} className={`${styles.assetTypeButton} ${uploadAssetType === key ? styles.activeType : ''}`} onClick={() => setUploadAssetType(key)}>
                                            {label} <span className={styles.aspectRatioLabel}>({width}x{height})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.uploadStep}>
                                <h3 className={styles.stepTitle}>Step 2: Upload & Process Image</h3>
                                <AssetUploader
                                    key={uploadAssetType}
                                    onUploadComplete={(dataUrl) => setProcessedImage(dataUrl)}
                                    aspectRatio={ASSET_TYPES[uploadAssetType].aspect}
                                    outputWidth={ASSET_TYPES[uploadAssetType].width}
                                    outputHeight={ASSET_TYPES[uploadAssetType].height}
                                />
                            </div>
                            {processedImage && (
                                <form onSubmit={handleUpload}>
                                    <div className={styles.uploadStep}>
                                        <h3 className={styles.stepTitle}>Step 3: Name Your Asset</h3>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newAssetName">Asset Name</label>
                                            <input type="text" id="newAssetName" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="e.g., Club Logo - White BG" required />
                                        </div>
                                    </div>
                                    <div className={styles.uploadStep}>
                                        <h3 className={styles.stepTitle}>Step 4: Choose Destination Folder</h3>
                                        <div className={styles.folderBrowserHeader}>
                                            {/* MODIFIED: Use the new Breadcrumbs component */}
                                            <Breadcrumbs path={uploadPath} onNavigate={handleUploadNav} />
                                            <button type="button" onClick={() => setIsCreatingFolder(true)} className={styles.newFolderButton}>New Folder</button>
                                        </div>
                                        <div className={styles.folderGrid}>
                                            {/* MODIFIED: In-line folder creation UI */}
                                            {isCreatingFolder && (
                                                <div className={styles.newFolderInputContainer}>
                                                    <FolderIcon />
                                                    <input 
                                                        type="text"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateAndSelectFolder()}
                                                        onBlur={handleCreateAndSelectFolder} // Create folder when input loses focus
                                                        placeholder="New folder name..."
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                            {uploadFolderView.subfolders.map(folder => (
                                                <button type="button" key={folder} className={`${styles.folderItem} ${destinationFolder === (uploadPath ? `${uploadPath}/${folder}` : folder) ? styles.selected : ''}`} onClick={() => setDestinationFolder(uploadPath ? `${uploadPath}/${folder}` : folder)}>
                                                    <FolderIcon />
                                                    <span className={styles.folderName}>{folder}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {uploadFolderView.subfolders.length === 0 && !isCreatingFolder && <p className={styles.emptyMessage}>No subfolders here. Click 'New Folder' to create one.</p>}
                                        <div className={styles.selectedFolderDisplay}>
                                            <strong>Selected Destination:</strong>
                                            {/* MODIFIED: Display logic is cleaner */}
                                            <span>{destinationFolder || uploadPath || 'Root'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.actionsContainer}>
                                        <button type="submit" className={styles.actionButton} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Upload Asset'}</button>
                                    </div>
                                    {message && <p className={styles.message}>{message}</p>}
                                </form>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
