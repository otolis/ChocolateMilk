import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { logHistory } from '../historyService';
import { X, Upload, Loader2 } from 'lucide-react';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'ImgBB upload failed');
  return {
    imageUrl: data.data.url,
    thumbUrl: data.data.thumb?.url || data.data.url,
  };
}

export function AddMilkModal({ isOpen, onClose }) {
  const { user, displayName } = useAuth();
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !imageFile) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { imageUrl, thumbUrl } = await uploadToImgBB(imageFile);

      const docRef = await addDoc(collection(db, 'items'), {
        name,
        imageUrl,
        thumbUrl,
        notes: notes || '',
        tierId: 'unranked',
        createdAt: new Date()
      });

      logHistory({
        action: 'added',
        itemId: docRef.id,
        itemName: name,
        fromTier: null,
        toTier: 'unranked',
        userId: user.uid,
        userName: displayName,
      });

      onClose();
      setName('');
      setImageFile(null);
      setNotes('');
    } catch (err) {
      console.error(err);
      setError('Failed to upload. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={22} />
        </button>

        <h2 className="modal-title">Add New Item</h2>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Choco Bliss"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image</label>
            <input
              type="file"
              className="form-file-input"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. too sweet, goated, mid..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? <><Loader2 className="animate-spin" size={18} /> Uploading...</>
              : <><Upload size={18} /> Add Item</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
