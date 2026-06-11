import express from 'express';

const app = express();

// Routes that handle their own raw body parsing (do not use express.json for these)
const RAW_ROUTES = ['/api/plants/upload', '/api/identify'];

app.use((req, res, next) => {
  if (RAW_ROUTES.includes(req.path)) return next();
  express.json()(req, res, next);
});

function wrap(handler) {
  return async (req, res) => {
    // Merge Express path params into req.query (Vercel serverless convention)
    // Express 5 defines req.query as a getter-only property, so use defineProperty to override it
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

const [
  { default: health },
  { default: identify },
  { default: register },
  { default: login },
  { default: refresh },
  { default: forgotPassword },
  { default: resetPassword },
  { default: changePassword },
  { default: plants },
  { default: plantStats },
  { default: uploadPlant },
  { default: plantById },
  { default: plantLike },
  { default: plantComments },
  { default: plantComment },
  { default: userProfile },
  { default: myPlants },
  { default: likedPlants },
  { default: userStats },
  { default: publicProfile },
  { default: publicPlants },
] = await Promise.all([
  import('./api/health.js'),
  import('./api/identify.js'),
  import('./api/auth/register.js'),
  import('./api/auth/login.js'),
  import('./api/auth/refresh.js'),
  import('./api/auth/forgot-password.js'),
  import('./api/auth/reset-password.js'),
  import('./api/auth/change-password.js'),
  import('./api/plants/index.js'),
  import('./api/plants/stats.js'),
  import('./api/plants/upload.js'),
  import('./api/plants/[id]/index.js'),
  import('./api/plants/[id]/like.js'),
  import('./api/plants/[id]/comments.js'),
  import('./api/plants/[id]/comments/[commentId].js'),
  import('./api/user/profile.js'),
  import('./api/user/my-plants.js'),
  import('./api/user/liked-plants.js'),
  import('./api/user/stats.js'),
  import('./api/users/[username]/profile.js'),
  import('./api/users/[username]/plants.js'),
]);

app.all('/api/health', wrap(health));
app.all('/api/identify', wrap(identify));
app.all('/api/auth/register', wrap(register));
app.all('/api/auth/login', wrap(login));
app.all('/api/auth/refresh', wrap(refresh));
app.all('/api/auth/forgot-password', wrap(forgotPassword));
app.all('/api/auth/reset-password', wrap(resetPassword));
app.all('/api/auth/change-password', wrap(changePassword));
// Note: more specific plant routes before /:id catch-all
app.all('/api/plants/stats', wrap(plantStats));
app.all('/api/plants/upload', wrap(uploadPlant));
app.all('/api/plants', wrap(plants));
app.all('/api/plants/:id/comments/:commentId', wrap(plantComment));
app.all('/api/plants/:id/comments', wrap(plantComments));
app.all('/api/plants/:id/like', wrap(plantLike));
app.all('/api/plants/:id', wrap(plantById));
app.all('/api/user/profile', wrap(userProfile));
app.all('/api/user/my-plants', wrap(myPlants));
app.all('/api/user/liked-plants', wrap(likedPlants));
app.all('/api/user/stats', wrap(userStats));
app.all('/api/users/:username/profile', wrap(publicProfile));
app.all('/api/users/:username/plants', wrap(publicPlants));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  API sunucusu: http://localhost:${PORT}\n`);
});
