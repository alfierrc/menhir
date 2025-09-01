const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

function parseFrontmatterDate(data) {
  const cand = data?.date || data?.created || data?.added || data?.updated;
  if (!cand) return null;
  const d = new Date(cand);
  return isNaN(d.getTime()) ? null : d;
}

async function scanVault(vaultDir) {
  if (!fs.existsSync(vaultDir)) return [];
  const types = fs
    .readdirSync(vaultDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const isMd = (n) => /\.md$/i.test(n);
  const items = [];

  for (const type of types) {
    const typeDir = path.join(vaultDir, type);
    let files = [];
    try {
      files = fs
        .readdirSync(typeDir, { withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => d.name)
        .filter(isMd);
    } catch {
      continue;
    }

    for (const file of files) {
      const fp = path.join(typeDir, file);
      try {
        const raw = fs.readFileSync(fp, "utf8");
        const fm = matter(raw);
        const stat = fs.statSync(fp);

        const fmDate = parseFrontmatterDate(fm.data);
        const sortTs = fmDate ? fmDate.getTime() : stat.mtimeMs;

        // check for and add cat id if not exist, maybe delete this later
        let catalogueId = fm.data.catalogueId;
        if (!catalogueId) {
          const typePrefix = type.toUpperCase().substring(0, 4);
          catalogueId = `${typePrefix}-${String(sortTs).slice(-6)}`;
        }

        items.push({
          type,
          slug: path.basename(file).replace(/\.md$/i, ""),
          ...fm.data,
          thumbnail: fm.data.thumbnail || null,
          catalogueId: catalogueId,
          content: fm.content || "",
          folder: type,
          sortTs,
          ...(fmDate ? { date: fmDate.toISOString() } : {}),
        });
      } catch (e) {
        console.warn("[reader] skip", fp, e.message);
      }
    }
  }
  return items;
}

module.exports = { scanVault };
