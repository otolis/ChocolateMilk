import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { MilkCard } from './MilkCard';

export function UnrankedZone({ id, items, onItemClick }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="unranked-section">
      <h3 className="unranked-label">Unranked</h3>
      <div ref={setNodeRef} className="unranked-dropzone">
        <SortableContext
          id={id}
          items={items.map(item => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          {items.map((item) => (
            <MilkCard key={item.id} id={item.id} item={item} onClick={onItemClick} />
          ))}
          {items.length === 0 && (
            <div className="unranked-placeholder">
              Drop items here or add them via the button above
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
