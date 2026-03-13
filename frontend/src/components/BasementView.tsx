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

export default function BasementView({ blocks, lastUpdated, onBlockUpdate, onShowToast }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedBlock = selectedId != null ? blocks.find(b => b.id === selectedId) ?? null : null;

  const time = lastUpdated?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const total = blocks.reduce((s, b) => s + b.quantity, 0);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* Top bar */}
        <div
          className="flex items-center justify-between mb-8 pb-5"
          style={{ borderBottom: '1px solid #1e2028' }}
        >
          <div>
            <h1 className="font-display text-white text-2xl leading-none">Daim Coffee</h1>
            <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Cold Brew · склад</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white tabular-nums">{total} шт.</p>
            <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
              {time ? `обновлено в ${time}` : '—'}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </>
  );
}
