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
import AssetDetailsModal from '@/components/AssetDetailsModal/AssetDetailsModal';
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

// --- NEW: Constants for aspect ratios ---
const ASSET_TYPES = {
    background: { label: 'Background', aspect: 1080 / 1350 },
    badge: { label: 'Badge', aspect: 1 / 1 },
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
    
    // --- State for Manage Tab ---
    const [currentPath, setCurrentPath] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- State for Add New Tab ---
    const [newAssetName, setNewAssetName] = useState('');
    const [uploadAssetType, setUploadAssetType] = useState('background');
    const [croppedImage, setCroppedImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPath, setUploadPath] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [destinationFolder, setDestinationFolder] = useState('');

    // --- Directory logic for both tabs ---
    const directoryTree = useMemo(() => {
        const tree = {};
        allAssets.forEach(asset => {
            const pathParts = (asset.Folder || 'uncategorized').split('/').filter(p => p);
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
        return { subfolders, assets, breadcrumbs: pathParts };
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
    
    const handleCreateNewFolder = () => {
        if (!newFolderName.trim()) return;
        const finalPath = uploadPath ? `${uploadPath}/${newFolderName.trim()}` : newFolderName.trim();
        setDestinationFolder(finalPath);
        setNewFolderName('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const finalDestination = destinationFolder || uploadPath;
        if (!croppedImage || !newAssetName || !finalDestination) {
            setMessage('Please fill out all fields and select a folder.');
            return;
        }
        setIsUploading(true);
        setMessage('');

        try {
            const imageBlob = dataURLtoBlob(croppedImage);
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
            
            setNewAssetName(''); setCroppedImage(''); setUploadPath(''); setDestinationFolder(''); setActiveTab('manage');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const manageBreadcrumbClick = (index) => {
        if (index < 0) { setCurrentPath(''); } else { setCurrentPath(manageView.breadcrumbs.slice(0, index + 1).join('/')); }
    };
    const manageFolderClick = (folder) => {
        setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder);
    };
    const uploadBreadcrumbClick = (index) => {
        if (index < 0) { setUploadPath(''); } else { setUploadPath(uploadFolderView.breadcrumbs.slice(0, index + 1).join('/')); }
        setDestinationFolder('');
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
                            {/* --- MANAGE TAB CONTENT - RESTORED --- */}
                            <div className={styles.sectionHeader}>
                                <nav className={styles.breadcrumbs}>
                                    <button onClick={() => manageBreadcrumbClick(-1)} title="Go to root folder"><HomeIcon /></button>
                                    {manageView.breadcrumbs.map((part, index) => (
                                        <span key={index}>
                                            <span className={styles.breadcrumbSeparator}>/</span>
                                            <button onClick={() => manageBreadcrumbClick(index)}>{part}</button>
                                        </span>
                                    ))}
                                </nav>
                            </div>

                            {manageView.subfolders.length > 0 && (
                                <div className={styles.folderGrid}>
                                    {manageView.subfolders.map(folder => (
                                        <button key={folder} className={styles.folderItem} onClick={() => manageFolderClick(folder)}>
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
                                    {Object.entries(ASSET_TYPES).map(([key, { label }]) => (
                                        <button key={key} className={`${styles.assetTypeButton} ${uploadAssetType === key ? styles.activeType : ''}`} onClick={() => setUploadAssetType(key)}>
                                            {label} <span className={styles.aspectRatioLabel}>({key === 'background' ? '1080x1350' : '1080x1080'})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.uploadStep}>
                                <h3 className={styles.stepTitle}>Step 2: Upload & Crop Image</h3>
                                <ImageEditor onCropComplete={(dataUrl) => setCroppedImage(dataUrl)} aspectRatio={ASSET_TYPES[uploadAssetType].aspect} />
                            </div>
                            {croppedImage && (
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
                                        <div className={styles.folderBrowser}>
                                            <nav className={styles.breadcrumbs}>
                                                <button type="button" onClick={() => uploadBreadcrumbClick(-1)} title="Go to root"><HomeIcon /></button>
                                                {uploadFolderView.breadcrumbs.map((part, index) => ( <span key={index}> <span className={styles.breadcrumbSeparator}>/</span> <button type="button" onClick={() => uploadBreadcrumbClick(index)}>{part}</button> </span> ))}
                                            </nav>
                                            <div className={styles.folderGrid}>
                                                {uploadFolderView.subfolders.map(folder => ( <button type="button" key={folder} className={styles.folderItem} onClick={() => { setUploadPath(uploadPath ? `${uploadPath}/${folder}` : folder); setDestinationFolder(''); }}> <FolderIcon /> <span className={styles.folderName}>{folder}</span> </button> ))}
                                            </div>
                                            {uploadFolderView.subfolders.length === 0 && <p className={styles.emptyMessage}>No subfolders here.</p>}
                                        </div>
                                        <div className={styles.folderSelection}>
                                            <div className={styles.newFolderCreator}>
                                                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Create new subfolder..." />
                                                <button type="button" onClick={handleCreateNewFolder} disabled={!newFolderName.trim()}>Create & Select</button>
                                            </div>
                                            <div className={styles.selectedFolderDisplay}>
                                                <strong>Selected:</strong> <span>{destinationFolder || uploadPath || 'Root'}</span>
                                            </div>
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
