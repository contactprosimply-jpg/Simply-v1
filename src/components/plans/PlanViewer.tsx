"use client";

import { X } from "lucide-react";

export function PlanViewer({ url, nom, onClose }: { url: string; nom: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <p className="truncate text-sm font-semibold text-white">{nom}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 bg-gray-900">
        <iframe src={url} title={nom} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
