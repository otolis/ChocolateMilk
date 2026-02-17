import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { logHistory } from './historyService';
import { TierRow } from './components/TierRow';
import { UnrankedZone } from './components/UnrankedZone';
import { AddMilkModal } from './components/AddMilkModal';
import { MilkDetailsModal } from './components/MilkDetailsModal';
import { MilkCard } from './components/MilkCard';
import { ShareButton } from './components/ShareButton';
import { HistorySection } from './components/HistorySection';
import { Plus, LogIn } from 'lucide-react';

const TIERS = [
  { id: 'GOLD', label: 'GOLD', color: 'var(--color-gold)' },
  { id: 'S', label: 'S', color: 'var(--color-s)' },
  { id: 'A', label: 'A', color: 'var(--color-a)' },
  { id: 'B', label: 'B', color: 'var(--color-b)' },
  { id: 'C', label: 'C', color: 'var(--color-c)' },
  { id: 'D', label: 'D', color: 'var(--color-d)' },
  { id: 'F', label: 'F', color: 'var(--color-f)' },
];

function App() {
  const { user, loading, login, logout, isEditor, displayName, authError } = useAuth();
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const tierListRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'items'), (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !isEditor) return;

    const activeItem = items.find(i => i.id === active.id);
    const overId = over.id;

    if (!activeItem) return;

    let newTierId = overId;

    const overItem = items.find(i => i.id === overId);
    if (overItem) {
      newTierId = overItem.tierId;
    }

    if (activeItem.tierId !== newTierId) {
      setItems(prev => prev.map(i =>
        i.id === activeItem.id ? { ...i, tierId: newTierId } : i
      ));
      const itemRef = doc(db, 'items', activeItem.id);
      updateDoc(itemRef, { tierId: newTierId });

      logHistory({
        action: 'moved',
        itemId: activeItem.id,
        itemName: activeItem.name,
        fromTier: activeItem.tierId,
        toTier: newTierId,
        userId: user.uid,
        userName: displayName,
      });
    }
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  const activeItem = items.find(i => i.id === activeId);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Tolis And Giannis Sokolatouxo Tier List</h1>
        <div className="header-actions">
          {user ? (
            <div className="user-info">
              <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              <span className="user-name">{displayName}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          ) : (
            <button className="btn-login" onClick={login}>
              <LogIn size={18} /> Sign in with Google
            </button>
          )}
          {authError && <div style={{color:'red',fontSize:'12px',maxWidth:'300px'}}>{authError}</div>}
          <ShareButton targetRef={tierListRef} />
          {isEditor && (
            <button className="btn-add" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} /> Add Chocolate Milk
            </button>
          )}
        </div>
      </header>

      <DndContext
        sensors={isEditor ? sensors : []}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div ref={tierListRef}>
          <div className="tier-list">
            {TIERS.map((tier) => (
              <TierRow
                key={tier.id}
                id={tier.id}
                label={tier.label}
                color={tier.color}
                items={items.filter(i => i.tierId === tier.id)}
                onItemClick={setSelectedItem}
              />
            ))}
          </div>

          <UnrankedZone
            id="unranked"
            items={items.filter(i => i.tierId === 'unranked')}
            onItemClick={setSelectedItem}
          />
        </div>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}>
          {activeItem ? <MilkCard id={activeItem.id} item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <AddMilkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <MilkDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />

      <HistorySection />
    </div>
  );
}

export default App;
