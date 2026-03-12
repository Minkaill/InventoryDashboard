import { Block } from '../types';

interface Props {
  block: Block;
  onClick: () => void;
}

type Status = 'ok' | 'low' | 'critical';

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

const dotColor: Record<Status, string> = {
  ok: '#22c55e',
  low: '#f97316',
  critical: '#ef4444',
};

export default function FlavorBlock({ block, onClick }: Props) {
  const status = getStatus(block);

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left rounded-2xl border bg-gray-900 hover:bg-gray-800 active:scale-[0.98] transition-all p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      style={{ borderColor: block.color + '44' }}
    >
      {/* Top color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ backgroundColor: block.color }}
      />

      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 text-xs uppercase tracking-widest font-semibold">Запас</span>
        <span className="relative flex h-3 w-3">
          {status !== 'ok' && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: dotColor[status] }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-3 w-3"
            style={{ backgroundColor: dotColor[status] }}
          />
        </span>
      </div>

      {/* Name */}
      <h2 className="text-base font-bold text-white mb-3 leading-snug">{block.name}</h2>

      {/* Quantity */}
      <div
        className="text-6xl font-black leading-none mb-4 tabular-nums"
        style={{ color: block.color }}
      >
        {block.quantity}
      </div>

      {/* Last transaction */}
      {block.last_transaction_at ? (
        <div className="text-gray-600 text-xs">
          {block.last_type === 'incoming' ? '↑' : '↓'}{' '}
          {block.last_quantity} · {relativeTime(block.last_transaction_at)}
        </div>
      ) : (
        <div className="text-gray-700 text-xs">Нет операций</div>
      )}
    </button>
  );
}
