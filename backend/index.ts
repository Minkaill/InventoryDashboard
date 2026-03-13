import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import blocksRouter from './routes/blocks';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/blocks', blocksRouter);

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Cold Brew backend running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
