/*
 * ==========================================================
 * COMPONENT: Match Result Icons
 * PAGE: /
 * FILE: /components/MatchResult/MatchResultIcons.js
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

// An icon for AI generation (magic wand / sparkles)
export const GenerateIcon = () => (
    <Icon>
        <path d="M12 3L14.34 7.66L19 10L14.34 12.34L12 17L9.66 12.34L5 10L9.66 7.66L12 3Z" />
        <path d="M3 21L5.34 16.34" />
        <path d="M18.66 5.34L21 3" />
    </Icon>
);

// An icon for editing (paint brush)
export const EditIcon = () => (
    <Icon>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </Icon>
);

// ADD THESE ICONS to MatchResultIcons.js

// An icon for adding an item
export const AddIcon = () => (
    <Icon>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </Icon>
);

// An icon for removing an item
export const RemoveIcon = () => (
    <Icon>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </Icon>
);
