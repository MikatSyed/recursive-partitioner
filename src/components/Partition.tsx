import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { partitionStore } from '../store/PartitionStore';
import ControlButtons from './ControlButtons';

type ResizeDirection = 'left' | 'right' | 'top' | 'bottom';

const Partition: React.FC<{ id: string }> = observer(({ id }) => {
  const partition = partitionStore.partitions[id];
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const partitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !partitionRef.current || !partition.parentId || !resizeDirection) return;

      const parent = partitionStore.partitions[partition.parentId];
      if (!parent) return;

      const parentRect = partitionRef.current.parentElement!.getBoundingClientRect();
      let newSize = parent.split === 'vertical'
        ? ((e.clientX - parentRect.left) / parentRect.width) * 100
        : ((e.clientY - parentRect.top) / parentRect.height) * 100;

      newSize = Math.max(10, Math.min(newSize, 90));
      partitionStore.resizePartitions(id, newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, id, partition.parentId, resizeDirection]);

  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const parent = partition.parentId ? partitionStore.partitions[partition.parentId] : null;
  const showResizeHandles = parent && parent.children.length > 0

  return partition ? (
    <div
      ref={partitionRef}
      className="relative border border-black"
      style={{
        backgroundColor: partition.color,
        width: parent?.split === 'vertical' ? `${partition.size}%` : '100%',
        height: parent?.split === 'horizontal' ? `${partition.size}%` : '100%',
      }}
    >
      <ControlButtons id={id} />
      {partition.split && (
        <div className={`flex ${partition.split === 'vertical' ? 'flex-row' : 'flex-col'} w-full h-full`}>
          {partition.children.map((childId) => (
            <Partition key={childId} id={childId} />
          ))}
        </div>
      )}
      {showResizeHandles && (
        <>
          {parent!.split === 'vertical' && (
            <>
              <div className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-gray-400" onMouseDown={handleResizeStart('left')} />
              <div className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-gray-400" onMouseDown={handleResizeStart('right')} />
            </>
          )}
          {parent!.split === 'horizontal' && (
            <>
              <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-gray-400" onMouseDown={handleResizeStart('top')} />
              <div className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-gray-400" onMouseDown={handleResizeStart('bottom')} />
            </>
          )}
        </>
      )}
    </div>
  ) : null;
});

export default Partition;
