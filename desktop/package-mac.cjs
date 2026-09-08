/* oxlint-disable typescript/no-require-imports */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const electronPackage = require(path.join(projectRoot, 'node_modules/electron/package.json'));
const electronDist = path.join(projectRoot, 'node_modules/electron/dist');
const electronApp = path.join(electronDist, 'Electron.app');
const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf10-electron-'));
const archiveName = `electron-v${electronPackage.version}-darwin-arm64.zip`;
const archivePath = path.join(cacheDir, archiveName);
const packagerBin = path.join(
  projectRoot,
  'node_modules/electron-packager/bin/electron-packager.js',
);

if (process.platform !== 'darwin') {
  console.error('macOS packaging must run on macOS.');
  process.exitCode = 1;
} else if (!fs.existsSync(electronApp)) {
  console.error(`Electron runtime not found: ${electronApp}`);
  process.exitCode = 1;
} else {
  try {
    const zipResult = spawnSync('zip', ['-q', '-y', '-r', archivePath, 'Electron.app'], {
      cwd: electronDist,
      stdio: 'inherit',
    });
    if (zipResult.status !== 0) {
      throw new Error('Failed to create the local Electron runtime archive.');
    }

    const packagerResult = spawnSync(
      process.execPath,
      [
        packagerBin,
        projectRoot,
        'GF10 Photo Desk',
        '--platform=darwin',
        '--arch=arm64',
        '--out=release',
        '--overwrite',
        '--prune=true',
        `--electron-version=${electronPackage.version}`,
        `--electron-zip-dir=${cacheDir}`,
        "--ignore=(^|/)(\\.git|\\.next|\\.vinext|\\.wrangler|outputs|work|release|release-pruned[^/]*)(/|$)",
      ],
      { cwd: projectRoot, stdio: 'inherit' },
    );
    process.exitCode = packagerResult.status ?? 1;
  } finally {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}
