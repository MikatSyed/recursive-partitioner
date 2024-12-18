import { makeAutoObservable } from 'mobx';

export interface Partition {
  id: string;
  color: string;
  split: 'vertical' | 'horizontal' | null;
  size: number;
  children: string[];
  parentId: string | null;
}

export class PartitionStore {
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
      size: 100,
      children: [],
      parentId,
    };
    if (parentId) {
      const parent = this.partitions[parentId];
      parent.children.push(id);
      this.redistributeSizes(parentId);
    }

    return id;
  }

  splitPartition(parentId: string, direction: 'vertical' | 'horizontal') {
    const parent = this.partitions[parentId];
    if (!parent || parent.split) return;

    parent.split = direction;
    const childId1 = this.createPartition(parentId, true);
    const childId2 = this.createPartition(parentId, false);
    parent.children = [childId1, childId2];
    this.redistributeSizes(parentId);
  }

  removePartition(id: string) {
    const partition = this.partitions[id];
    if (!partition || id === this.rootPartitionId) return;
  
    const parent = this.partitions[partition.parentId!];
    if (parent) {
      parent.children = parent.children.filter(childId => childId !== id);
      this.redistributeSizes(parent.id);
  
      if (parent.children.length === 0) {
        this.removePartition(parent.id);
      } else if (parent.children.length === 1) {
        const remainingChildId = parent.children[0];
        const remainingChild = this.partitions[remainingChildId];
        remainingChild.parentId = parent.parentId;
        if (parent.parentId) {
          const grandparent = this.partitions[parent.parentId];
          grandparent.children = grandparent.children.map(childId => 
            childId === parent.id ? remainingChildId : childId
          );
        } else {
          this.rootPartitionId = remainingChildId;
        }
        delete this.partitions[parent.id];
      }
    }
    this.usedColors.delete(partition.color);
    delete this.partitions[id];
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

  resizePartitions(id: string, newSize: number) {
    const partition = this.partitions[id];
    console.log(partition,'106')
    if (!partition || !partition.parentId) return;
  
    const parent = this.partitions[partition.parentId];
    if (!parent.children.length) return;
  
    const siblings = parent.children.filter(childId => childId !== id);
  
    if (siblings.length === 1) {
      const sibling = this.partitions[siblings[0]];
  
      const siblingNewSize = 100 - newSize;
      if (siblingNewSize < 10 || siblingNewSize > 90) return;
      partition.size = newSize;
      sibling.size = siblingNewSize;

    } else {
      const oldSize = partition.size;
      const sizeDiff = newSize - oldSize;
  
      partition.size = newSize;
  
      const totalSiblingSize = siblings.reduce((sum, siblingId) => sum + this.partitions[siblingId].size, 0);
  
      siblings.forEach(siblingId => {
        const sibling = this.partitions[siblingId];
        const proportion = sibling.size / totalSiblingSize;
        sibling.size -= sizeDiff * proportion;
      });
    }
  
    this.redistributeSizes(parent.id);
  }

  redistributeSizes(parentId: string) {
    const parent = this.partitions[parentId];
    if (!parent || parent.children.length === 0) return;

    const totalSize = parent.children.reduce((sum, childId) => sum + this.partitions[childId].size, 0);
    const scaleFactor = 100 / totalSize;

    parent.children.forEach(childId => {
      this.partitions[childId].size *= scaleFactor;
    });
  }
  get partitionCount() {
    return Object.keys(this.partitions).length;
  }
}

export const partitionStore = new PartitionStore();

