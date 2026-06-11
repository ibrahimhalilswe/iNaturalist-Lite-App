import express from 'express';
import health from './_health.js';
import identify from './_identify.js';
import register from './_auth/register.js';
import login from './_auth/login.js';
import refresh from './_auth/refresh.js';
import forgotPassword from './_auth/forgot-password.js';
import resetPassword from './_auth/reset-password.js';
import changePassword from './_auth/change-password.js';
import plants from './_plants/index.js';
import plantStats from './_plants/stats.js';
import uploadPlant from './_plants/upload.js';
import plantById from './_plants/[id]/index.js';
import plantLike from './_plants/[id]/like.js';
import plantComments from './_plants/[id]/comments.js';
import plantComment from './_plants/[id]/comments/[commentId].js';
import userProfile from './_user/profile.js';
import myPlants from './_user/my-plants.js';
import likedPlants from './_user/liked-plants.js';
import userStats from './_user/stats.js';
import publicProfile from './_users/[username]/profile.js';
import publicPlants from './_users/[username]/plants.js';

const app = express();

const RAW_ROUTES = ['/api/plants/upload', '/api/identify'];
app.use((req, res, next) => {
  if (RAW_ROUTES.some(r => req.path === r)) return next();
  express.json()(req, res, next);
});

function wrap(handler) {
  return async (req, res) => {
    Object.defineProperty(req, 'query', {
      configurable: true,
      writable: true,
      value: { ...req.query, ...req.params },
    });
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  };
}

const P = '/api';
app.all(`${P}/health`, wrap(health));
app.all(`${P}/identify`, wrap(identify));
app.all(`${P}/auth/register`, wrap(register));
app.all(`${P}/auth/login`, wrap(login));
app.all(`${P}/auth/refresh`, wrap(refresh));
app.all(`${P}/auth/forgot-password`, wrap(forgotPassword));
app.all(`${P}/auth/reset-password`, wrap(resetPassword));
app.all(`${P}/auth/change-password`, wrap(changePassword));
app.all(`${P}/plants/stats`, wrap(plantStats));
app.all(`${P}/plants/upload`, wrap(uploadPlant));
app.all(`${P}/plants`, wrap(plants));
app.all(`${P}/plants/:id/comments/:commentId`, wrap(plantComment));
app.all(`${P}/plants/:id/comments`, wrap(plantComments));
app.all(`${P}/plants/:id/like`, wrap(plantLike));
app.all(`${P}/plants/:id`, wrap(plantById));
app.all(`${P}/user/profile`, wrap(userProfile));
app.all(`${P}/user/my-plants`, wrap(myPlants));
app.all(`${P}/user/liked-plants`, wrap(likedPlants));
app.all(`${P}/user/stats`, wrap(userStats));
app.all(`${P}/users/:username/profile`, wrap(publicProfile));
app.all(`${P}/users/:username/plants`, wrap(publicPlants));

app.get('/', (req, res) => {
  res.json({ name: 'iNaturalist Lite API', status: 'running', version: '1.0.0' });
});

export default app;
