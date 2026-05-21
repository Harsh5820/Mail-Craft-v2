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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
