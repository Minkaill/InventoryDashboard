import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

const blockWithLastTx = `
  SELECT b.*,
    t.type as last_type,
    t.quantity as last_quantity,
    t.created_at as last_transaction_at
  FROM blocks b
  LEFT JOIN transactions t ON t.id = (
    SELECT id FROM transactions WHERE block_id = b.id ORDER BY created_at DESC LIMIT 1
  )
`;

router.get('/', (_req: Request, res: Response) => {
  const blocks = db.prepare(blockWithLastTx + ' ORDER BY b.id').all();
  res.json(blocks);
});

router.get('/:id', (req: Request, res: Response) => {
  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
  if (!block) return res.status(404).json({ error: 'Block not found' });
  res.json(block);
});

router.post('/:id/transaction', (req: Request, res: Response) => {
  const { type, quantity, note } = req.body as {
    type: string;
    quantity: number;
    note?: string;
  };

  if (!['incoming', 'outgoing'].includes(type)) {
    return res.status(400).json({ error: 'Неверный тип операции' });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Количество должно быть положительным целым числом' });
  }

  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id) as {
    id: number;
    quantity: number;
  } | undefined;

  if (!block) return res.status(404).json({ error: 'Block not found' });

  const newQuantity = type === 'incoming'
    ? block.quantity + quantity
    : block.quantity - quantity;

  if (newQuantity < 0) {
    return res.status(400).json({ error: 'Недостаточно товара на складе' });
  }

  const doTransaction = db.transaction(() => {
    db.prepare('UPDATE blocks SET quantity = ? WHERE id = ?').run(newQuantity, req.params.id);
    db.prepare(
      'INSERT INTO transactions (block_id, type, quantity, note) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, type, quantity, note ?? null);
  });

  doTransaction();

  const updated = db.prepare(blockWithLastTx + ' WHERE b.id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/:id/history', (req: Request, res: Response) => {
  const history = db.prepare(
    'SELECT * FROM transactions WHERE block_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.params.id);
  res.json(history);
});

export default router;
