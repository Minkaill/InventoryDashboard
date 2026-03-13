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
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
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

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const updateBlock = useCallback((updated: Block) => {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    setLastUpdated(new Date());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#111318' }}>
        <span className="text-sm text-gray-500">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#111318' }}>
      <BasementView
        blocks={blocks}
        lastUpdated={lastUpdated}
        onBlockUpdate={updateBlock}
        onShowToast={showToast}
      />

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
            style={
              toast.type === 'success'
                ? { background: '#1a2a1a', color: '#4ade80', border: '1px solid #166534' }
                : { background: '#1f1315', color: '#f87171', border: '1px solid #7f1d1d' }
            }
          >
            <span style={{ fontSize: '10px' }}>{toast.type === 'success' ? '●' : '●'}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
