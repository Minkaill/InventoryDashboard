import { Block, Transaction } from '../types';

const BASE = '/api';

export async function getBlocks(): Promise<Block[]> {
  const res = await fetch(`${BASE}/blocks`);
  if (!res.ok) throw new Error('Failed to fetch blocks');
  return res.json();
}

export async function addTransaction(
  blockId: number,
  type: 'incoming' | 'outgoing',
  quantity: number,
  note?: string
): Promise<Block> {
  const res = await fetch(`${BASE}/blocks/${blockId}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, quantity, note }),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error || 'Ошибка операции');
  }
  return res.json();
}

export async function getHistory(blockId: number): Promise<Transaction[]> {
  const res = await fetch(`${BASE}/blocks/${blockId}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
