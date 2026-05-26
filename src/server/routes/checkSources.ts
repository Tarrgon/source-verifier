import express from 'express';
import { Database, replaceId } from '../../modules';
import SourceCheckerManager from '../../checkers/SourceCheckerManager';
const router = express.Router();

router.get('/bulk', async (req, res) => {
  try {
    if (!req.query.ids || typeof (req.query.ids) !== 'string') {
      return res.sendStatus(400);
    }

    const data = await Database.getManySources(req.query.ids.split(',').map(id => parseInt(id)));
    if (!data) return res.sendStatus(500);
    res.json(data.map(d => replaceId(d)));
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get('/update/:id', async (req, res) => {
  try {
    if (!req.params.id || typeof (req.params.id) !== 'string') {
      return res.sendStatus(400);
    }

    const data = await SourceCheckerManager.update(parseInt(req.params.id), req.query.waitfordata == 'true', req.query.forceupdate == 'true');
    if (!data) return res.sendStatus(500);

    res.json(data);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.sendStatus(400);
    }

    const data = await Database.getSource(parseInt(req.params.id));
    if (!data) return res.sendStatus(500);

    res.json(replaceId(data));
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

export default () => {
  return {
    router,
    path: '/checksources'
  };
};
