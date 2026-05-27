import express from 'express';
import { Database, E621Handler } from '../../modules';
import SourceCheckerManager from '../../checkers/SourceCheckerManager';
const router = express.Router();

router.post('/:id', async (req, res) => {
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
      return res.json({ notIndexed: true });
    }

    SourceCheckerManager.queuePosts([post], true, [res.json.bind(res)], req.body);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

export default () => {
  return {
    router,
    path: '/checkadditionalsources'
  };
};
