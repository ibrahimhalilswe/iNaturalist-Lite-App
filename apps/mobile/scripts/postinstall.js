const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/react-native/Libraries/Core/setUpPerformance.js'
);

if (!fs.existsSync(file)) {
  console.log('[postinstall] setUpPerformance.js not found, skipping patch.');
  process.exit(0);
}

const original = fs.readFileSync(file, 'utf8');

// Already patched
if (original.includes('Object.defineProperty(global, \'performance\'')) {
  console.log('[postinstall] setUpPerformance.js already patched.');
  process.exit(0);
}

const patched = original.replace(
  `if (NativePerformance) {\n  // $FlowExpectedError[cannot-write]\n  global.performance = new Performance();\n} else {`,
  `if (NativePerformance) {\n  try {\n    // $FlowExpectedError[cannot-write]\n    global.performance = new Performance();\n  } catch (e) {\n    try {\n      Object.defineProperty(global, 'performance', {\n        configurable: true,\n        writable: true,\n        value: new Performance(),\n      });\n    } catch (e2) {}\n  }\n} else {`
);

if (patched === original) {
  console.log('[postinstall] Pattern not found in setUpPerformance.js — skipping.');
  process.exit(0);
}

fs.writeFileSync(file, patched, 'utf8');
console.log('[postinstall] setUpPerformance.js patched successfully.');
