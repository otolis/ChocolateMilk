import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { logHistory } from '../historyService';
import { X, Trash2, Loader2 } from 'lucide-react';

export function MilkDetailsModal({ isOpen, onClose, item }) {
  const { user, isEditor, displayName } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={22} />
        </button>

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
      </div>
    </div>
  );
}
