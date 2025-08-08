const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

async function saveItem(vaultPath, item) {
  const folder = path.join(vaultPath, item.folder);
  const file = path.join(folder, `${item.slug}.md`);
  const { content = '', ...frontmatter } = item;
  const md = matter.stringify(content, frontmatter);
  await fs.writeFile(file, md, 'utf8');
}

module.exports = { saveItem };
