'use client';

import React, {  useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { makeAutoObservable } from 'mobx';

// Partition interface
interface Partition {
  id: string;
  color: string;
  split: 'vertical' | 'horizontal' | null;
  size: number;
  children: string[];
  parentId: string | null;
}

// Partition store
class PartitionStore {
  partitions: Record<string, Partition> = {};
  rootPartitionId: string | null = null;
  usedColors: Set<string> = new Set();

  constructor() {
    makeAutoObservable(this);
    const rootId = this.createPartition();
    this.rootPartitionId = rootId;
  }

  createPartition(parentId: string | null = null, inheritColor: boolean = false): string {
    const id = `${Date.now()}-${Math.random()}`;
    const color = inheritColor && parentId ? this.partitions[parentId]?.color : this.getUniqueColor(parentId);
    this.partitions[id] = {
      id,
      color,
      split: null,
      size: 50,
      children: [],
      parentId,
    };

    if (parentId) {
      const parent = this.partitions[parentId];
      parent.children.push(id);
    }

    return id;
  }

  splitPartition(parentId: string, direction: 'vertical' | 'horizontal') {
    const parent = this.partitions[parentId];
    if (!parent || parent.split) return;

    parent.split = direction;

    const childId1 = this.createPartition(parentId, true);  // child 1 inherits parent's color
    const childId2 = this.createPartition(parentId, false); // child 2 gets unique color

    parent.children = [childId1, childId2];
  }

  removePartition(id: string) {
    const partition = this.partitions[id];
    if (!partition || id === this.rootPartitionId) return;

    const parent = this.partitions[partition.parentId!];
    if (parent) {
      parent.children = parent.children.filter(childId => childId !== id);

      // If parent has no children left after removing the partition, remove the parent too
      if (parent.children.length === 0) {
        this.removePartition(parent.id); // Recursively remove the parent
      }

      // Remove the partition
      this.usedColors.delete(partition.color);
      delete this.partitions[id];
    }
  }

  getUniqueColor(parentId: string | null): string {
    let color;
    do {
      color = this.getRandomColor();
    } while (this.usedColors.has(color) || (parentId && this.partitions[parentId]?.color === color));
    this.usedColors.add(color);
    return color;
  }

  getRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 30;
    const lightness = 40 + Math.random() * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  get partitionCount() {
    return Object.keys(this.partitions).length;
  }
}

// Create a partition store instance
const partitionStore = new PartitionStore();

// Control buttons component
const ControlButtons: React.FC<{ id: string }> = ({ id }) => {
  const handleSplit = (direction: 'vertical' | 'horizontal') => {
    console.log(`Splitting Partition: ${id}, Direction: ${direction}`);
    partitionStore.splitPartition(id, direction);
  };

  const handleRemove = () => {
    console.log(`Removing Partition: ${id}`);
    partitionStore.removePartition(id);
  };

  // Check if this partition is the last one
  const isOnlyPartition = partitionStore.partitionCount === 1;
  const partition = partitionStore.partitions[id];
  const isParentSplit = partition && partition.split;

  // Hide the control buttons if the parent has been split into children
  const hideButtons = isParentSplit;

  return (
    <div className={`absolute inset-0 flex justify-center items-center z-10 ${hideButtons ? 'hidden' : ''}`}>
      <div className="flex justify-center space-x-2 items-center">
        <button
          className="bg-white px-2 py-1 rounded text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleSplit('vertical');
          }}
        >
          v
        </button>
        <button
          className="bg-white px-2 py-1 rounded text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleSplit('horizontal');
          }}
        >
          h
        </button>
        {!isOnlyPartition && id !== partitionStore.rootPartitionId && (
          <button
            className="bg-white px-2 py-1 rounded text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            -
          </button>
        )}
      </div>
    </div>
  );
};

// Partition component
const Partition: React.FC<{ id: string }> = observer(({ id }) => {
  const partition = partitionStore.partitions[id];

  if (!partition) return null;

  return (
    <div
      className="relative w-full h-full border border-black"
      style={{
        backgroundColor: partition.color,
        display: 'flex',
        flexDirection: partition.split ? (partition.split === 'vertical' ? 'row' : 'column') : 'initial',
      }}
    >
      <ControlButtons id={id} />
      {partition.split ? (
        <div
          className={`flex ${partition.split === 'vertical' ? 'flex-row' : 'flex-col'} w-full h-full`}
        >
          {partition.children.map((childId) => (
            <div key={childId} style={{ flex: 1, position: 'relative' }}>
              <Partition id={childId} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

// Home component
const Home: React.FC = observer(() => {
  useEffect(() => {
    if (!partitionStore.rootPartitionId) {
      partitionStore.createPartition();
    }
  }, []);

  if (!partitionStore.rootPartitionId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen">
      <Partition id={partitionStore.rootPartitionId} />
    </div>
  );
});

export default Home;
