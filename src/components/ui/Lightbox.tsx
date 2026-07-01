"use client";

import { X } from "lucide-react";

export function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/80 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand shadow-lg"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt=""
        className="relative z-10 max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}
