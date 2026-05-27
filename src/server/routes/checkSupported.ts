import express, { type Response } from 'express';
import SourceCheckerManager from '../../checkers/SourceCheckerManager';
const router = express.Router();

router.post('/', async (req, res: Response<{ supported: boolean }>) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.sendStatus(400);
    }

    const anySupported = SourceCheckerManager.anyLinksSupported(req.body);
    res.json({ supported: anySupported });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

export default () => {
  return {
    router,
    path: '/checksupported'
  };
};
