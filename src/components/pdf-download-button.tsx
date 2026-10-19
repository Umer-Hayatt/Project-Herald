"use client";

import { useState } from "react";

interface PdfDownloadButtonProps {
  editionId: string;
  editionDate: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export function PdfDownloadButton({
  editionId,
  editionDate,
  variant = "secondary",
  className = "",
}: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/editions/${editionId}/pdf`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Edition not found or access denied."
            : "Failed to generate newspaper PDF."
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Herald-${editionDate}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err: unknown) {
      console.error("[Herald] PDF download error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download PDF. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const buttonClass =
    variant === "primary"
      ? "button pdf-btn pdf-download-btn"
      : "secondary-button pdf-btn pdf-download-btn";

  return (
    <div className={`pdf-download-wrapper ${className}`}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className={buttonClass}
        aria-label={
          isDownloading
            ? "Preparing newspaper PDF download"
            : `Download newspaper PDF for ${editionDate}`
        }
        aria-busy={isDownloading}
        data-testid="pdf-download-button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={isDownloading ? "animate-spin" : ""}
        >
          {isDownloading ? (
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          ) : (
            <>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </>
          )}
        </svg>
        <span>{isDownloading ? "Preparing PDF..." : "Download PDF"}</span>
      </button>

      {error && (
        <div
          role="alert"
          className="pdf-download-error"
          aria-live="polite"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-link retry-link"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
