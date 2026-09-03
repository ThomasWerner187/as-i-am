import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) throw new Error("Run npm run build first.");
const ref = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const output = join(root, "output", "netcup");
const stage = join(output, "site");
mkdirSync(output, { recursive: true });
rmSync(stage, { recursive: true, force: true });
cpSync(dist, stage, { recursive: true, filter: path => !path.endsWith(".map") });
cpSync(join(root, "deploy", "netcup", ".htaccess"), join(stage, ".htaccess"));

function filesIn(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${relative}`);
    return entry.isDirectory() ? filesIn(join(dir, entry.name), relative) : [relative];
  }).sort();
}
const files = filesIn(stage);
for (const file of files) {
  if (/(^|\/)(\.env(?:\.|$)|\.git(?:\/|$)|node_modules(?:\/|$))|\.(pem|key|p12|db|sqlite3?)$/i.test(file)) {
    throw new Error(`Private file must not be deployed: ${file}`);
  }
}
const zip = join(output, `as-i-am-netcup-${ref.slice(0, 7)}.zip`);
rmSync(zip, { force: true });
execFileSync("zip", ["-q", "-X", zip, ...files], { cwd: stage });
execFileSync("unzip", ["-t", zip], { stdio: "pipe" });
const sha256 = createHash("sha256").update(readFileSync(zip)).digest("hex");
const record = { sourceRef: ref, target: "https://asiam.wernerverse.de", archive: zip, sha256, files, generatedAt: new Date().toISOString() };
writeFileSync(join(output, "package-manifest.json"), `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify({ ...record, files: files.length }, null, 2));
