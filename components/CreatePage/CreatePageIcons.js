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

export const SquadIcon = () => (
    <Icon>
        <path d="M12 2L4 6v6l8 4 8-4V6z"></path>
        <line x1="4" y1="6" x2="20" y2="6"></line>
    </Icon>
);

export const ResultIcon = () => (
    <Icon>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M12 11.6v6.4"></path>
        <path d="M12 2c-1.66 0-3 1.34-3 3v2a3 3 0 0 0 6 0V5c0-1.66-1.34-3-3-3z"></path>
        <path d="M7 10h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"></path>
    </Icon>
);

export const BespokeIcon = () => (
    <Icon>
        {/* A star icon for "Bespoke" to imply custom/special */}
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </Icon>
);
