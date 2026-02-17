import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../AuthContext';

export function MilkCard({ id, item, onClick }) {
  const { isEditor } = useAuth();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditor ? listeners : {})}
      className={`milk-card ${!isEditor ? 'milk-card--view-only' : ''}`}
      onClick={() => onClick?.(item)}
    >
      <div
        className="milk-card-image"
        style={{ backgroundImage: `url(${item.thumbUrl || item.imageUrl})` }}
      >
        <div className="milk-card-label">{item.name}</div>
      </div>
    </div>
  );
}
