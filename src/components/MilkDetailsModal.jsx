import React, { useState, useEffect } from 'react';
import { 
  doc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { logHistory } from '../historyService';
import { X, Trash2, Loader2, Pencil, Save, MessageSquare, Send, LogIn } from 'lucide-react';

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

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Fetch comments
  useEffect(() => {
    if (!isOpen || !item?.id) return;

    const q = query(
      collection(db, 'comments'),
      where('itemId', '==', item.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(docs);
    });

    return () => unsubscribe();
  }, [isOpen, item?.id]);

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

  const handlePostComment = async (e) => {
    e?.preventDefault();
    if (!user || !newComment.trim()) return;

    setPostingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        itemId: item.id,
        text: newComment.trim(),
        userId: user.uid,
        userName: displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Failed to post comment.');
    } finally {
      setPostingComment(false);
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

            <div className="comments-section">
              <div className="comments-header">
                <MessageSquare size={20} />
                <span>Comments ({comments.length})</span>
              </div>

              {user ? (
                <form className="comment-input-area" onSubmit={handlePostComment}>
                  <div className="user-info" style={{ marginBottom: '1rem' }}>
                    <img src={user.photoURL} alt={displayName} className="user-avatar" />
                    <span className="user-name">{displayName}</span>
                  </div>
                  <div className="comment-input-wrapper">
                    <textarea
                      className="comment-textarea"
                      placeholder="Share your thoughts on this chocolate milk..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={postingComment}
                    />
                    <div className="comment-actions">
                      <button 
                        type="submit" 
                        className="btn-post-comment"
                        disabled={postingComment || !newComment.trim()}
                      >
                        {postingComment ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <>
                            <Send size={16} />
                            Post
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="comment-login-hint">
                  <p>Sign in with Google to join the conversation!</p>
                  <button className="btn-login" onClick={() => useAuth().login()}>
                    <LogIn size={18} /> Sign In
                  </button>
                </div>
              )}

              <div className="comments-list">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-card">
                      <img 
                        src={comment.userPhoto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                        alt={comment.userName} 
                        className="comment-avatar" 
                      />
                      <div className="comment-body">
                        <div className="comment-meta">
                          <span className="comment-author">{comment.userName}</span>
                          <span className="comment-date">
                            {comment.createdAt?.toDate ? (
                              new Date(comment.createdAt.toDate()).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            ) : (
                              'Just now'
                            )}
                          </span>
                        </div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments">No comments yet. Be the first to leave one!</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
