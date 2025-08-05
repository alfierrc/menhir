const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function scanVault(vaultDir) {
  const contentTypes = fs.readdirSync(vaultDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const allItems = [];

  for (const type of contentTypes) {
    const typeDir = path.join(vaultDir, type);
    const files = fs.readdirSync(typeDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(typeDir, file);
        const slug = path.basename(file, '.md');

        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        allItems.push({
          type,
          slug,
          ...frontmatter,
          content,
          folder: `${type}`,  // we'll use this for image path
        });
      }
    }
  }

  return allItems;
}

module.exports = {
  scanVault,
};