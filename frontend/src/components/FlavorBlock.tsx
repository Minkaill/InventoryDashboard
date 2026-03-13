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

const statusDot: Record<Status, string> = {
  ok: '#22c55e',
  low: '#f59e0b',
  critical: '#ef4444',
};

export default function FlavorBlock({ block, onClick }: Props) {
  const status = getStatus(block);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl p-5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{
        background: '#16181d',
        border: '1px solid #1e2028',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#2a2d38';
        (e.currentTarget as HTMLElement).style.background = '#18191f';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#1e2028';
        (e.currentTarget as HTMLElement).style.background = '#16181d';
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: block.color }}
          />
          <span className="text-xs font-medium truncate" style={{ color: '#6b7280' }}>
            {block.name}
          </span>
        </div>
        {/* Status dot */}
        <div className="relative flex h-2 w-2 flex-shrink-0 mt-0.5">
          {status !== 'ok' && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: statusDot[status] }}
            />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: statusDot[status] }}
          />
        </div>
      </div>

      {/* Quantity */}
      <div
        className="font-display tabular-nums leading-none mb-4"
        style={{ fontSize: '3.5rem', color: '#ffffff' }}
      >
        {block.quantity}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#1e2028', marginBottom: '12px' }} />

      {/* Last transaction */}
      {block.last_transaction_at ? (
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs"
            style={{ color: block.last_type === 'incoming' ? '#22c55e' : '#9ca3af' }}
          >
            {block.last_type === 'incoming' ? '+' : '−'}{block.last_quantity}
          </span>
          <span className="text-xs" style={{ color: '#374151' }}>·</span>
          <span className="text-xs" style={{ color: '#374151' }}>
            {relativeTime(block.last_transaction_at)}
          </span>
        </div>
      ) : (
        <span className="text-xs" style={{ color: '#374151' }}>Нет операций</span>
      )}
    </button>
  );
}
