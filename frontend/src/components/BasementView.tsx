import { useState } from 'react';
import { Block, Toast } from '../types';
import FlavorBlock from './FlavorBlock';
import BlockModal from './BlockModal';

interface Props {
  blocks: Block[];
  lastUpdated: Date | null;
  onBlockUpdate: (block: Block) => void;
  onShowToast: (message: string, type: Toast['type']) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function BasementView({ blocks, lastUpdated, onBlockUpdate, onShowToast }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedBlock = selectedId != null
    ? blocks.find(b => b.id === selectedId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-white tracking-tight">Подвал</h1>
          {lastUpdated && (
            <p className="text-gray-600 text-sm mt-1">
              Обновлено в {formatTime(lastUpdated)}
            </p>
          )}
        </div>

        {/* Blocks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {blocks.map(block => (
            <FlavorBlock
              key={block.id}
              block={block}
              onClick={() => setSelectedId(block.id)}
            />
          ))}
        </div>
      </div>

      {selectedBlock && (
        <BlockModal
          block={selectedBlock}
          onClose={() => setSelectedId(null)}
          onBlockUpdate={onBlockUpdate}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
