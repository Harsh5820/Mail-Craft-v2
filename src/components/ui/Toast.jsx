'use client';

import { useState, useEffect, useCallback } from 'react';

const toasts = [];
let listeners = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function showToast(message, type = 'success', duration = 4000) {
  const id = Date.now() + Math.random();
  toasts.push({ id, message, type });
  notify();
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.splice(idx, 1);
      notify();
    }
  }, duration);
}

export default function Toast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed z-[100] flex flex-col gap-3 pointer-events-none bottom-24 left-4 right-auto items-start lg:bottom-6 lg:right-6 lg:left-auto lg:items-end">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type} pointer-events-auto w-auto max-w-[85vw] lg:max-w-sm text-left backdrop-blur-md shadow-xl`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
