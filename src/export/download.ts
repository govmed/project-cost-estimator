/**
 * Browser download trigger.
 *
 * Given a Blob and filename, creates an object URL, opens it via a
 * temporary <a download> element, then revokes the URL. The standard
 * client-side download pattern; no file-saver dep needed.
 *
 * Returns true on success, false in non-browser environments (e.g. SSR
 * or jsdom tests that lack URL.createObjectURL).
 */

export function downloadBlob(blob: Blob, filename: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false;
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Revoke after a tick so the browser has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}
