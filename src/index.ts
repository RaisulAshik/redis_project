import express, { Application } from 'express';
import imageRoutes              from './route';

const app: Application = express();
const PORT             = parseInt(process.env.PORT ?? '3000', 10);

app.use(express.json());
app.use('/images', imageRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;