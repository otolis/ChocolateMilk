import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Loader2 } from 'lucide-react';

function downloadCanvas(canvas) {
  const link = document.createElement('a');
  link.download = 'sokolatouxo-tier-list.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function ShareButton({ targetRef }) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!targetRef?.current) return;
    setLoading(true);

    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
      });

      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'tier-list.png', { type: 'image/png' });
          try {
            await navigator.share({
              title: 'Sokolatouxo Tier List',
              files: [file],
            });
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              downloadCanvas(canvas);
            }
          }
          setLoading(false);
        }, 'image/png');
        return;
      }

      downloadCanvas(canvas);
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-share" onClick={handleShare} disabled={loading}>
      {loading
        ? <><Loader2 className="animate-spin" size={18} /> Capturing...</>
        : <><Share2 size={18} /> Share</>
      }
    </button>
  );
}
