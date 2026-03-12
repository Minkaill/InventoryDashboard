import { useState, useEffect, useCallback } from 'react';
import { Block, Toast } from './types';
import { getBlocks } from './services/api';
import BasementView from './components/BasementView';

export default function App() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const fetchBlocks = useCallback(async () => {
    try {
      const data = await getBlocks();
      setBlocks(data);
      setLastUpdated(new Date());
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const updateBlock = useCallback((updated: Block) => {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    setLastUpdated(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500 text-lg tracking-wide">Загрузка...</div>
        </div>
      ) : (
        <BasementView
          blocks={blocks}
          lastUpdated={lastUpdated}
          onBlockUpdate={updateBlock}
          onShowToast={showToast}
        />
      )}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-green-950 text-green-300 border-green-800'
                : 'bg-red-950 text-red-300 border-red-800'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
