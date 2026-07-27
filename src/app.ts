import express, { Application, Request, Response } from "express";

const app: Application = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
