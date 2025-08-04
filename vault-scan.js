const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Path to your vault directory
const vaultPath = path.join(__dirname, 'vault');

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
        const slug = path.basename(file, '.md'); // e.g. "beach-day"

        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        const item = {
          type,        // e.g. "photos"
          slug,        // e.g. "beach-day"
          ...frontmatter,
          content,     // Markdown content after frontmatter
          filePath     // Absolute or relative path to the file
        };

        allItems.push(item);
      }
    }
  }

  return allItems;
}

// Run it
const items = scanVault(vaultPath);
console.log(items);
