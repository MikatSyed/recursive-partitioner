import React from 'react';
import { partitionStore } from '../store/PartitionStore';

const Button: React.FC<{ label: string; onClick: React.MouseEventHandler }> = ({ label, onClick }) => (
  <button className="bg-white px-2 py-1 rounded text-xs" onClick={onClick}>
    {label}
  </button>
);

const ControlButtons: React.FC<{ id: string }> = ({ id }) => {
  const partition = partitionStore.partitions[id];
  const isRootPartition = id === partitionStore.rootPartitionId;

  if (partition.split) return null;

  const handleAction = (action: 'vertical' | 'horizontal' | 'remove') => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action === 'remove') partitionStore.removePartition(id);
    else partitionStore.splitPartition(id, action);
  };

  return (
    <div className="absolute inset-0 flex justify-center items-center z-10">
      <div className="flex justify-center space-x-2 items-center">
        <Button label="v" onClick={handleAction('vertical')} />
        <Button label="h" onClick={handleAction('horizontal')} />
        {!isRootPartition && <Button label="-" onClick={handleAction('remove')} />}
      </div>
    </div>
  );
};

export default ControlButtons;
