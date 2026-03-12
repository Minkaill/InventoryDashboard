export interface Block {
  id: number;
  name: string;
  color: string;
  quantity: number;
  low_threshold: number;
  critical_threshold: number;
  last_type?: 'incoming' | 'outgoing';
  last_quantity?: number;
  last_transaction_at?: string;
}

export interface Transaction {
  id: number;
  block_id: number;
  type: 'incoming' | 'outgoing';
  quantity: number;
  note?: string;
  created_at: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}
