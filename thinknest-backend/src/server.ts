import express from 'express';
import 'dotenv/config';

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/', (_req, res) => {
  res.send('Thinknest backend is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
