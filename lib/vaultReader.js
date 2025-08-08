const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

async function scanVault(vaultDir) {
  if (!fs.existsSync(vaultDir)) return [];

  const types = fs.readdirSync(vaultDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name); // e.g., image, product, note

  const isMd = (n) => /\.md$/i.test(n);
  const items = [];

  for (const type of types) {
    const typeDir = path.join(vaultDir, type);
    let files = [];
    try {
      files = fs.readdirSync(typeDir, { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => d.name)
        .filter(isMd);
    } catch {
      continue;
    }

    for (const file of files) {
      const fp = path.join(typeDir, file);
      try {
        const raw = fs.readFileSync(fp, 'utf8');
        const fm  = matter(raw);
        items.push({
          type,                         // from folder name
          slug: path.basename(file).replace(/\.md$/i, ''),
          ...fm.data,                   // frontmatter
          content: fm.content || '',
          folder: type,                 // used by image path later
        });
      } catch (e) {
        console.warn('[reader] skip file', fp, e.message);
      }
    }
  }
  return items;
}

module.exports = { scanVault };
