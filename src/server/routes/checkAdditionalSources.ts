import express, { type Response } from 'express';
import { Database, E621Handler, replaceId, type DatabasePost } from '../../modules';
import SourceCheckerManager, { type Result } from '../../checkers/SourceCheckerManager';
import type { ServerResponse } from '../types.d';
import { getServerResponse } from '../common';
const router = express.Router();

router.post('/:id', async (req, res: Response<ServerResponse>) => {
  try {
    if (!req.params.id || !Array.isArray(req.body)) {
      return res.sendStatus(400);
    }

    const id = parseInt(req.params.id);

    let post = await Database.getPost(id);

    if (!post) {
      post = await E621Handler.updatePost(id, true);
    }

    if (!post) {
      return res.json({ id, notIndexed: true });
    }

    SourceCheckerManager.queuePosts([post], true, [callbackFunction.bind(null, res, post)], req.body);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

function callbackFunction(res: Response<ServerResponse>, post: DatabasePost, result: Result) {
  res.json(getServerResponse(post, result));
}

export default () => {
  return {
    router,
    path: '/checkadditionalsources'
  };
};
