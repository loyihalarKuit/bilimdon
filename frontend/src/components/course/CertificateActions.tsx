"use client";

import { useState } from "react";

export function CertificateActions() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard ruxsati yo'q */
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={copy} className="btn-secondary">
        {copied ? "Nusxalandi!" : "Havolani nusxalash"}
      </button>
      <button onClick={() => window.print()} className="btn-primary">
        PDF yuklab olish
      </button>
    </div>
  );
}
