const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mobileNodeModules = path.join(root, 'apps', 'mobile', 'node_modules');
const rootNodeModules = path.join(root, 'node_modules');

const packagesToLink = ['expo'];

for (const pkg of packagesToLink) {
  const junctionPath = path.join(rootNodeModules, pkg);
  const target = path.join(mobileNodeModules, pkg);

  if (!fs.existsSync(target)) continue;

  try {
    if (fs.existsSync(junctionPath)) {
      const stat = fs.lstatSync(junctionPath);
      if (stat.isSymbolicLink() || stat.isFIFO()) {
        fs.rmSync(junctionPath, { recursive: true, force: true });
      } else {
        continue;
      }
    }
    fs.symlinkSync(target, junctionPath, 'junction');
    console.log(`[postinstall] Junction created: node_modules/${pkg} -> apps/mobile/node_modules/${pkg}`);
  } catch (e) {
    console.warn(`[postinstall] Could not create junction for ${pkg}:`, e.message);
  }
}
