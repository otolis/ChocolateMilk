import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { logHistory } from '../historyService';
import { X, Trash2, Loader2, Pencil, Save } from 'lucide-react';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST', body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'ImgBB upload failed');
  return {
    imageUrl: data.data.url,
    thumbUrl: data.data.thumb?.url || data.data.url,
  };
}

export function MilkDetailsModal({ isOpen, onClose, item }) {
  const { user, isEditor, displayName } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setEditName(item.name || '');
      setEditNotes(item.notes || '');
    }
    setEditing(false);
    setEditImageFile(null);
    setError('');
    setConfirmDelete(false);
  }, [item]);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'items', item.id));
      logHistory({
        action: 'deleted',
        itemId: item.id,
        itemName: item.name,
        fromTier: item.tierId,
        toTier: null,
        userId: user.uid,
        userName: displayName,
      });
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updates = {
        name: editName.trim(),
        notes: editNotes.trim(),
      };

      if (editImageFile) {
        const { imageUrl, thumbUrl } = await uploadToImgBB(editImageFile);
        updates.imageUrl = imageUrl;
        updates.thumbUrl = thumbUrl;
      }

      await updateDoc(doc(db, 'items', item.id), updates);

      logHistory({
        action: 'edited',
        itemId: item.id,
        itemName: editName.trim(),
        fromTier: item.tierId,
        toTier: item.tierId,
        userId: user.uid,
        userName: displayName,
      });

      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    setEditing(false);
    setEditImageFile(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={22} />
        </button>

        {editing ? (
          <>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="details-image-wrapper">
              <img
                className="details-image"
                src={editImageFile ? URL.createObjectURL(editImageFile) : item.imageUrl}
                alt={editName}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Replace Image (optional)</label>
              <input
                className="form-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setEditImageFile(e.target.files[0] || null)}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes..."
              />
            </div>

            {error && <div className="form-error" style={{ marginTop: '0.75rem' }}>{error}</div>}

            <button
              className="btn-submit"
              style={{ marginTop: '1rem' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="animate-spin" size={18} /> Saving...</>
                : <><Save size={18} /> Save Changes</>
              }
            </button>
          </>
        ) : (
          <>
            <h2 className="details-title">{item.name}</h2>

            <div className="details-image-wrapper">
              <img
                className="details-image"
                src={item.imageUrl}
                alt={item.name}
              />
            </div>

            {item.notes && (
              <p className="details-notes">{item.notes}</p>
            )}

            {isEditor && (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Edit Item
              </button>
            )}

            {isEditor && (
              <button
                className={`btn-delete ${confirmDelete ? 'btn-delete--confirm' : ''}`}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? <><Loader2 className="animate-spin" size={16} /> Deleting...</>
                  : confirmDelete
                    ? <><Trash2 size={16} /> Tap again to confirm</>
                    : <><Trash2 size={16} /> Delete Item</>
                }
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
