/*
 * ==========================================================
 * COMPONENT: Up Next Announcement Icons
 * PAGE: /
 * FILE: /components/UpNextAnnouncement/UpNextAnnouncementIcons.js
 * ==========================================================
 */
// A simple wrapper to handle sizing and styling for all icons
const Icon = ({ children }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

// An icon for the image gallery
export const GalleryIcon = () => (
    <Icon>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </Icon>
);

// An icon for uploading a custom image
export const UploadIcon = () => (
    <Icon>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </Icon>
);
