import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { partitionStore } from './store/PartitionStore';
import ResizablePartition from './components/Partition';

const App: React.FC = observer(() => {
  useEffect(() => {
    if (!partitionStore.rootPartitionId) partitionStore.createPartition();
  }, []);

  return partitionStore.rootPartitionId ? (
    <div className="w-screen h-screen">
      <ResizablePartition id={partitionStore.rootPartitionId} />
    </div>
  ) : <div>Loading...</div>;
});

export default App;
