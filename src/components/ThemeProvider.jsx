'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return <>{children}</>;
}
