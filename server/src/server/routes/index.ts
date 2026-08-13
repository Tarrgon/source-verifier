import express, { type Response } from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  res.render('index');
});

export default () => {
  return {
    router,
    path: '/'
  };
};
