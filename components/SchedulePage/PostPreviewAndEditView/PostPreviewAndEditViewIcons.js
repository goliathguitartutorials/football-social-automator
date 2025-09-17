/*
 * ==========================================================
 * COMPONENT: PostPreviewAndEditViewIcons
 * PAGE: Schedule Page
 * FILE: /components/SchedulePage/PostPreviewAndEditView/PostPreviewAndEditViewIcons.js
 * ==========================================================
*/

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

export const GenerateIcon = () => (
    <Icon>
        <path d="M12 3L14.34 7.66L19 10L14.34 12.34L12 17L9.66 12.34L5 10L9.66 7.66L12 3Z" />
        <path d="M3 21L5.34 16.34" />
        <path d="M18.66 5.34L21 3" />
    </Icon>
);

export const EditIcon = () => (
    <Icon>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </Icon>
);

export const DeleteIcon = () => (
    <Icon>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </Icon>
);

export const CalendarIcon = () => (
    <Icon>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </Icon>
);

export const BackIcon = () => (
     <Icon>
        <polyline points="15 18 9 12 15 6"></polyline>
    </Icon>
);
