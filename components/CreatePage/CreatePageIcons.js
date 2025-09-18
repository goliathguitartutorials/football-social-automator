/*
 * ==========================================================
 * COMPONENT: Create Page Icons
 * PAGE: /
 * FILE: /components/CreatePage/CreatePageIcons.js
 * ==========================================================
 */

// A simple wrapper to handle sizing and styling for all icons
const Icon = ({ children }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

export const UpNextIcon = () => (
    <Icon>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </Icon>
);

export const MatchDayIcon = () => (
    <Icon>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </Icon>
);

// A simpler "users" icon to represent a team/squad
export const SquadIcon = () => (
    <Icon>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </Icon>
);

// A simpler "medal" icon to represent a result
export const ResultIcon = () => (
    <Icon>
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88"></polyline>
    </Icon>
);

export const BespokeIcon = () => (
    <Icon>
        {/* A star icon for "Bespoke" to imply custom/special */}
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </Icon>
);

// NEW: Icon for the Custom Image upload workflow
export const CustomImageIcon = () => (
    <Icon>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </Icon>
);
