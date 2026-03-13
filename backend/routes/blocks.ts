import { Router, Request, Response } from 'express';
import client from '../db';

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

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await client.execute(blockWithLastTx + ' ORDER BY b.id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await client.execute({
      sql: 'SELECT * FROM blocks WHERE id = ?',
      args: [req.params.id],
    });
    if (!rows[0]) return res.status(404).json({ error: 'Block not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/:id/transaction', async (req: Request, res: Response) => {
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

  try {
    const { rows } = await client.execute({
      sql: 'SELECT * FROM blocks WHERE id = ?',
      args: [req.params.id],
    });
    if (!rows[0]) return res.status(404).json({ error: 'Block not found' });

    const currentQty = rows[0].quantity as number;
    const newQuantity = type === 'incoming' ? currentQty + quantity : currentQty - quantity;

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Недостаточно товара на складе' });
    }

    await client.batch([
      {
        sql: 'UPDATE blocks SET quantity = ? WHERE id = ?',
        args: [newQuantity, req.params.id],
      },
      {
        sql: 'INSERT INTO transactions (block_id, type, quantity, note) VALUES (?, ?, ?, ?)',
        args: [req.params.id, type, quantity, note ?? null],
      },
    ], 'write');

    const updated = await client.execute({
      sql: blockWithLastTx + ' WHERE b.id = ?',
      args: [req.params.id],
    });
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { rows } = await client.execute({
      sql: 'SELECT * FROM transactions WHERE block_id = ? ORDER BY created_at DESC LIMIT 50',
      args: [req.params.id],
    });
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
