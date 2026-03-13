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

const statusColor: Record<Status, string> = {
  ok: '#22c55e',
  low: '#f59e0b',
  critical: '#ef4444',
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
    if (activeAction) quantityRef.current?.focus();
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
      setHistory(await getHistory(block.id));
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

  const inputStyle = {
    background: '#111318',
    border: '1px solid #1e2028',
    color: '#f9fafb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full md:max-w-sm flex flex-col overflow-hidden"
        style={{
          background: '#16181d',
          border: '1px solid #1e2028',
          borderRadius: '16px 16px 0 0',
          maxHeight: '90vh',
        }}
        // on md+ round all corners
        ref={el => {
          if (el && window.innerWidth >= 768) {
            el.style.borderRadius = '16px';
          }
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderBottom: '1px solid #1e2028' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: block.color }}
              />
              <span className="text-sm font-medium text-white truncate">{block.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4b5563'; }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quantity + status */}
          <div className="flex items-end justify-between mt-4">
            <span
              className="font-display tabular-nums leading-none text-white"
              style={{ fontSize: '3.5rem' }}
            >
              {block.quantity}
            </span>
            <span
              className="text-xs font-medium mb-1.5 px-2 py-1 rounded-md"
              style={{
                color: statusColor[status],
                background: statusColor[status] + '18',
              }}
            >
              {statusLabel[status]}
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderBottom: '1px solid #1e2028' }}
        >
          {!activeAction ? (
            <div className="flex gap-2">
              <button
                onClick={() => openAction('incoming')}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: '#1e2028', color: '#f9fafb', border: '1px solid #2a2d38' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2a2d38'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1e2028'; }}
              >
                Приход +
              </button>
              <button
                onClick={() => openAction('outgoing')}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'transparent', color: '#6b7280', border: '1px solid #1e2028' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e2028'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
              >
                Расход −
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#374151' }}>
                {activeAction === 'incoming' ? 'Приход' : 'Расход'}
              </p>
              <input
                ref={quantityRef}
                type="number"
                min="1"
                placeholder="Количество"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ ...inputStyle, fontSize: '16px', fontWeight: '600' }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d38'; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e2028'; }}
              />
              <input
                type="text"
                placeholder="Комментарий"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d38'; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e2028'; }}
              />
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: '#1e2028', color: '#f9fafb', border: '1px solid #2a2d38' }}
                  onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#2a2d38'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1e2028'; }}
                >
                  {submitting ? 'Сохранение...' : 'Подтвердить'}
                </button>
                <button
                  onClick={cancelAction}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'transparent', color: '#6b7280', border: '1px solid #1e2028' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e2028'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#374151' }}>
            История
          </p>

          {loadingHistory ? (
            <p className="text-xs" style={{ color: '#374151' }}>Загрузка...</p>
          ) : history.length === 0 ? (
            <p className="text-xs" style={{ color: '#374151' }}>Нет операций</p>
          ) : (
            <div>
              {history.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2.5"
                  style={{
                    borderBottom: i < history.length - 1 ? '1px solid #1e2028' : 'none',
                  }}
                >
                  <span
                    className="text-xs font-bold w-4 text-center flex-shrink-0"
                    style={{ color: t.type === 'incoming' ? '#22c55e' : '#ef4444' }}
                  >
                    {t.type === 'incoming' ? '+' : '−'}
                  </span>
                  <span
                    className="text-sm font-semibold tabular-nums flex-shrink-0"
                    style={{ color: '#f9fafb', minWidth: '2.5rem' }}
                  >
                    {t.quantity}
                  </span>
                  <span className="text-xs truncate flex-1" style={{ color: '#4b5563' }}>
                    {t.note || '—'}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: '#374151' }}>
                    {relativeTime(t.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
