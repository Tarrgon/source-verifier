import express, { type Response } from 'express';
import { Database, replaceId, type BaseSourceData } from '../../modules';
import SourceCheckerManager from '../../checkers/SourceCheckerManager';
import type { ServerResponse } from '../types.d';
import { getServerResponse } from '../common';
const router = express.Router();

router.get('/bulk', async (req, res: Response<ServerResponse[]>) => {
  try {
    if (!req.query.ids || typeof (req.query.ids) !== 'string') {
      return res.sendStatus(400);
    }

    const ids = req.query.ids.split(',').map(id => parseInt(id));

    const posts = await Database.getManyPosts(ids)
    const data = await Database.getManySources(ids);
    if (!data) return res.sendStatus(500);

    res.json(data.map((d: BaseSourceData) => {
      const post = posts.find(p => p._id == d._id)!;

      return getServerResponse(post, replaceId(d));
    }));
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get('/update/:id', async (req, res: Response<ServerResponse>) => {
  try {
    if (!req.params.id || typeof (req.params.id) !== 'string') {
      return res.sendStatus(400);
    }

    const id = parseInt(req.params.id);

    const post = await Database.getPost(id);
    const data = await SourceCheckerManager.update(id, req.query.waitfordata == 'true', req.query.forceupdate == 'true');
    if (!data || !post) return res.sendStatus(500);

    res.json(getServerResponse(post, data));
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get('/:id', async (req, res: Response<ServerResponse>) => {
  try {
    if (!req.params.id) {
      return res.sendStatus(400);
    }

    const id = parseInt(req.params.id);

    const post = await Database.getPost(id);
    const sourceData = await Database.getSource(id);
    if (!post) return res.json({ id, notIndexed: true });
    if (!sourceData) return res.json({ id, queued: true });

    res.json(getServerResponse(post, replaceId(sourceData)));
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
