const { scanVault } = require('./vaultReader');

(async () => {
  try {
    const vaultPath = process.argv[2];
    const items = await scanVault(vaultPath);
    process.stdout.write(JSON.stringify(items));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
