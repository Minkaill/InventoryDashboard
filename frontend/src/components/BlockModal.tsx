import { useState, useEffect, useRef } from 'react';
import { Block, Transaction, Toast } from '../types';
import { addTransaction, getHistory } from '../services/api';

interface Props {
  block: Block;
  onClose: () => void;
  onBlockUpdate: (block: Block) => void;
  onShowToast: (message: string, type: Toast['type']) => void;
}

type Status = 'ok' | 'low' | 'critical';
type ActionType = 'incoming' | 'outgoing';

function getStatus(block: Block): Status {
  if (block.quantity <= block.critical_threshold) return 'critical';
  if (block.quantity <= block.low_threshold) return 'low';
  return 'ok';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин. назад`;
  if (hour < 24) return `${hour} ч. назад`;
  if (day === 1) return 'вчера';
  return `${day} дн. назад`;
}

const statusLabel: Record<Status, string> = {
  ok: 'В норме',
  low: 'Мало',
  critical: 'Критично',
};

const statusClass: Record<Status, string> = {
  ok: 'bg-green-950 text-green-400 border-green-900',
  low: 'bg-orange-950 text-orange-400 border-orange-900',
  critical: 'bg-red-950 text-red-400 border-red-900',
};

export default function BlockModal({ block, onClose, onBlockUpdate, onShowToast }: Props) {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const quantityRef = useRef<HTMLInputElement>(null);
  const status = getStatus(block);

  useEffect(() => {
    getHistory(block.id)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [block.id]);

  useEffect(() => {
    if (activeAction) {
      quantityRef.current?.focus();
    }
  }, [activeAction]);

  const openAction = (type: ActionType) => {
    setActiveAction(type);
    setQuantity('');
    setNote('');
  };

  const cancelAction = () => {
    setActiveAction(null);
    setQuantity('');
    setNote('');
  };

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      onShowToast('Введите корректное количество', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await addTransaction(block.id, activeAction!, qty, note || undefined);
      onBlockUpdate(updated);
      const newHistory = await getHistory(block.id);
      setHistory(newHistory);
      onShowToast(
        activeAction === 'incoming' ? `+${qty} добавлено` : `−${qty} списано`,
        'success'
      );
      setActiveAction(null);
      setQuantity('');
      setNote('');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') cancelAction();
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-end md:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-gray-900 w-full md:max-w-lg rounded-t-3xl md:rounded-3xl border border-gray-800 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-5 border-b border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full mb-2"
                style={{ backgroundColor: block.color }}
              />
              <h2 className="text-xl font-bold text-white truncate">{block.name}</h2>
              <div className="flex items-end gap-3 mt-1">
                <span
                  className="text-5xl font-black tabular-nums leading-none"
                  style={{ color: block.color }}
                >
                  {block.quantity}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold border mb-1 ${statusClass[status]}`}>
                  {statusLabel[status]}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-white transition-colors p-1 flex-shrink-0 mt-1"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 p-6 pb-5 border-b border-gray-800">
          {!activeAction ? (
            <div className="flex gap-3">
              <button
                onClick={() => openAction('incoming')}
                className="flex-1 bg-green-950 hover:bg-green-900 text-green-400 font-semibold py-3 rounded-xl transition-colors text-sm border border-green-900 hover:border-green-700"
              >
                Приход +
              </button>
              <button
                onClick={() => openAction('outgoing')}
                className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 font-semibold py-3 rounded-xl transition-colors text-sm border border-red-900 hover:border-red-700"
              >
                Расход −
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                {activeAction === 'incoming' ? '↑ Приход' : '↓ Расход'}
              </p>
              <input
                ref={quantityRef}
                type="number"
                min="1"
                placeholder="Количество"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 text-lg font-semibold tabular-nums"
              />
              <input
                type="text"
                placeholder="Комментарий (необязательно)"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 text-sm"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeAction === 'incoming'
                      ? 'bg-green-900 hover:bg-green-800 text-green-200'
                      : 'bg-red-900 hover:bg-red-800 text-red-200'
                  }`}
                >
                  {submitting ? 'Сохранение...' : 'Подтвердить'}
                </button>
                <button
                  onClick={cancelAction}
                  disabled={submitting}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto p-6 pt-5">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-4">История</p>

          {loadingHistory ? (
            <p className="text-gray-600 text-sm">Загрузка...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-700 text-sm">Нет операций</p>
          ) : (
            <div className="space-y-1">
              {history.map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-800/60 last:border-0"
                >
                  <span
                    className={`text-base font-bold w-5 text-center flex-shrink-0 ${
                      t.type === 'incoming' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {t.type === 'incoming' ? '↑' : '↓'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-semibold text-sm tabular-nums ${
                          t.type === 'incoming' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {t.type === 'incoming' ? '+' : '−'}{t.quantity}
                      </span>
                      {t.note && (
                        <span className="text-gray-600 text-xs truncate">{t.note}</span>
                      )}
                    </div>
                    <div className="text-gray-700 text-xs mt-0.5">{relativeTime(t.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
