const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { z } = require('zod');
const { randomUUID } = require('crypto');

const ItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  title: z.string().optional(),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  image: z.string().optional(),
  price: z.number().optional(),
  metadata: z.record(z.any()).optional()
}).passthrough();


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

        const rawItem = {
          type,
          slug,
          ...frontmatter,
          content,
          folder: `${type}`,
        };
        
        const parsed = ItemSchema.safeParse(rawItem);
        let item = parsed.success ? parsed.data : rawItem;
        
        if (!item.id) item.id = randomUUID();
        
        if (item.created instanceof Date) item.created = item.created.toISOString();
        if (item.updated instanceof Date) item.updated = item.updated.toISOString();
        
        allItems.push(item);
        
      }
    }
  }

  return allItems;
}

module.exports = {
  scanVault,
};