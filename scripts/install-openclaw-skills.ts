import "dotenv/config";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = process.cwd();
const workspace = resolveWorkspace(
  process.env.OPENCLAW_WORKSPACE || join(homedir(), ".openclaw", "workspace")
);
const jarvisApiUrl = process.env.JARVIS_API_URL ?? "http://localhost:3001";
const jarvisApiKey = process.env.JARVIS_API_KEY;

if (!jarvisApiKey) {
  console.error("[JARVIS] Variável de ambiente obrigatória não definida: JARVIS_API_KEY");
  process.exit(1);
}

const copies = [
  {
    source: join(projectRoot, "agent", "jarvis.md"),
    destination: join(workspace, "agents", "jarvis", "agent.md")
  },
  {
    source: join(projectRoot, "agent", "jarvis-search.md"),
    destination: join(workspace, "agents", "jarvis-search", "agent.md")
  },
  {
    source: join(projectRoot, "skills", "jarvis-db", "skill.md"),
    destination: join(workspace, "skills", "jarvis-db", "skill.md")
  },
  {
    source: join(projectRoot, "skills", "smart-home", "skill.md"),
    destination: join(workspace, "skills", "smart-home", "skill.md")
  },
  {
    source: join(projectRoot, "skills", "clawlink", "skill.md"),
    destination: join(workspace, "skills", "clawlink", "skill.md")
  },
  {
    source: join(projectRoot, "skills", "jarvis-shell", "skill.md"),
    destination: join(workspace, "skills", "jarvis-shell", "skill.md")
  },
  {
    source: join(projectRoot, "skills", "jarvis-search", "skill.md"),
    destination: join(workspace, "skills", "jarvis-search", "skill.md")
  }
];

for (const { destination } of copies) {
  mkdirSync(resolve(destination, ".."), { recursive: true });
}

for (const { source, destination } of copies) {
  cpSync(source, destination);
}

const jarvisDbSkillPath = join(workspace, "skills", "jarvis-db", "skill.md");
const jarvisDbSkill = readFileSync(jarvisDbSkillPath, "utf8")
  .replaceAll("{JARVIS_API_URL}", jarvisApiUrl)
  .replaceAll("{JARVIS_API_KEY}", jarvisApiKey);

writeFileSync(jarvisDbSkillPath, jarvisDbSkill);

console.log("Skills e agente JARVIS instalados no OpenClaw:");
for (const { destination } of copies) {
  console.log(`- ${destination}`);
}

function resolveWorkspace(value: string) {
  if (value === "~") {
    return homedir();
  }

  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return join(homedir(), value.slice(2));
  }

  return resolve(value);
}
