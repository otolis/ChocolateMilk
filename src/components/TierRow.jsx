import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { MilkCard } from './MilkCard';

export function TierRow({ id, label, color, items, onItemClick }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="tier-row">
      <div className="tier-header" style={{ backgroundColor: color }}>
        {label}
      </div>
      <div ref={setNodeRef} className="tier-dropzone">
        <SortableContext
          id={id}
          items={items.map(item => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          {items.map((item) => (
            <MilkCard key={item.id} id={item.id} item={item} onClick={onItemClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
