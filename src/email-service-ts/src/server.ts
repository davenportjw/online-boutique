import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import ejs from 'ejs';
import path from 'path';

const app = express();
const logger = pino({
  name: 'email-service-ts',
  messageKey: 'message',
  formatters: {
    level (logLevelString, logLevelNum) {
      return { severity: logLevelString }
    }
  }
});

const PORT = process.env.PORT || 3002;

interface SendOrderConfirmationRequest {
    email: string;
    order: any;
}

app.use(express.json());

app.post('/sendOrderConfirmation', async (req: Request, res: Response) => {
  try {
    const { email, order } = req.body as SendOrderConfirmationRequest;

    if (!email || !order) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const templatePath = path.join(__dirname, '../templates/confirmation.html');
    const html = await ejs.renderFile(templatePath, { order });
    logger.info(`Order confirmation email sent to ${email}:\n${html}`);

    res.status(200).send();
  } catch (error) {
    logger.error('Failed to send order confirmation', error);
    res.status(500).json({ error: 'An unexpected error occurred during sending order confirmation.' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
