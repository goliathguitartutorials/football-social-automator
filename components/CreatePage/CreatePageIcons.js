/*
 * ==========================================================
 * COMPONENT: Create Page Icons
 * PAGE: /
 * FILE: /components/CreatePage/CreatePageIcons.js
 ==========================================================
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

export const MatchDayIcon = () => (
    <Icon>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </Icon>
);

export const UpNextIcon = () => (
    <Icon>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </Icon>
);

export const SquadIcon = () => (
    <Icon>
        <path d="M20.38 3.46 16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.45a2 2 0 0 0 2 1.86h1.28L8 18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1.88-7h1.28a2 2 0 0 0 2-1.86l.58-3.45a2 2 0 0 0-1.34-2.23z"></path>
    </Icon>
);

export const ResultIcon = () => (
    <Icon>
        <path d="M12 2c3.866 0 7 2.686 7 6v2h-2V8c0-2.21-2.239-4-5-4s-5 1.79-5 4v2H5V8c0-3.314 3.134-6 7-6z"></path>
        <path d="M4 10h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"></path>
    </Icon>
);

export const BespokeIcon = () => (
    <Icon>
        <path d="M12 2L9 5l3 7 3-7-3-2z"></path>
        <path d="M2 12l5-3-2 3-2 3-1-3z"></path>
        <path d="m22 12-5-3 2 3 2 3 1-3z"></path>
        <path d="M12 22l3-7-3 2-3-2 3 7z"></path>
    </Icon>
);
