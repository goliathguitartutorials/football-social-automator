'use client';

import { AppProvider } from './context/AppContext';

export default function AppWrapper({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
