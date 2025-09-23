/*
 * ==========================================================
 * COMPONENT: Breadcrumbs
 * PAGE: /assets
 * FILE: /components/AssetsPage/Breadcrumbs.js
 * ==========================================================
 */
'use client';

import styles from './Breadcrumbs.module.css';
import { HomeIcon } from './AssetsPageIcons'; // Assuming icons are in the parent folder

export default function Breadcrumbs({ path, onNavigate }) {
    const pathParts = path ? path.split('/').filter(p => p) : [];

    return (
        <nav className={styles.breadcrumbsNav}>
            <button 
                onClick={() => onNavigate(-1)} 
                className={styles.breadcrumbButton}
                title="Go to root folder"
            >
                <HomeIcon />
            </button>
            {pathParts.map((part, index) => (
                <span key={index} className={styles.breadcrumbSegment}>
                    <span className={styles.separator}>/</span>
                    <button 
                        onClick={() => onNavigate(index)} 
                        className={styles.breadcrumbButton}
                    >
                        {part}
                    </button>
                </span>
            ))}
        </nav>
    );
}
