import express from 'express';
import cors from 'cors';
import blocksRouter from './routes/blocks';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/blocks', blocksRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Cold Brew backend running on http://0.0.0.0:${PORT}`);
});
