import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const then = timestamp.toDate().getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return timestamp.toDate().toLocaleDateString();
}

function formatEntry(entry) {
  switch (entry.action) {
    case 'moved':
      return `${entry.userName} moved ${entry.itemName} from ${entry.fromTier} to ${entry.toTier}`;
    case 'added':
      return `${entry.userName} added ${entry.itemName}`;
    case 'deleted':
      return `${entry.userName} deleted ${entry.itemName}`;
    default:
      return `${entry.userName} did something with ${entry.itemName}`;
  }
}

export function HistorySection() {
  const [entries, setEntries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="history-section">
      <button className="history-toggle" onClick={() => setIsOpen(!isOpen)}>
        <History size={16} />
        <span>History ({entries.length})</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="history-list">
          {entries.length === 0 && (
            <div className="history-empty">No history yet</div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="history-entry">
              <span className="history-text">{formatEntry(entry)}</span>
              <span className="history-time">{formatRelativeTime(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
