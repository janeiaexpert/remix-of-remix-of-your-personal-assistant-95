import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export type Skill = {
  id: string;
  name: string;
  description: string;
  content: string;
};

function parseSkill(id: string, raw: string): Skill {
  const nameMatch = raw.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : id;
  const descMatch = raw.match(/^##\s+Descrição\s*\n+(.+?)(?=\n##|\n#|$)/ims);
  const description = descMatch
    ? descMatch[1].trim().slice(0, 200)
    : raw.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim()?.slice(0, 200) ?? "";
  return { id, name, description, content: raw };
}

function bundledSkills(): Skill[] {
  try {
    // Embutido no build (funciona em serverless sem fs, ex: Vercel).
    const glob = import.meta.glob("../../skills/*.md", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    return Object.entries(glob).map(([p, raw]) => {
      const id = (p.split("/").pop() ?? "").replace(/\.md$/, "");
      return parseSkill(id, raw);
    });
  } catch {
    return [];
  }
}

function dirSkills(dir: string): Skill[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => parseSkill(f.replace(/\.md$/, ""), readFileSync(join(dir, f), "utf-8")));
  } catch {
    return [];
  }
}

export function listSkills(): Skill[] {
  // Prioridade: disco local > /tmp (nuvem, criadas em runtime) > bundle (build)
  const merged = new Map<string, Skill>();
  for (const s of [...bundledSkills(), ...dirSkills(join(tmpdir(), "jarvis-skills")), ...dirSkills(join(process.cwd(), "skills"))]) {
    merged.set(s.id, s);
  }
  return [...merged.values()];
}

export function getSkillContent(id: string): string | null {
  try {
    for (const dir of [join(process.cwd(), "skills"), join(tmpdir(), "jarvis-skills")]) {
      const p = join(dir, `${id}.md`);
      if (existsSync(p)) return readFileSync(p, "utf-8");
    }
    const bundled = bundledSkills().find((s) => s.id === id);
    return bundled ? bundled.content : null;
  } catch {
    return null;
  }
}

export function buildSkillsPrompt(activeIds: string[]): string {
  if (!activeIds.length) return "";
  const parts: string[] = [];
  for (const id of activeIds) {
    const content = getSkillContent(id);
    if (content) parts.push(content);
  }
  if (!parts.length) return "";
  return `\n\n=== SKILLS ATIVAS ===\n${parts.join("\n\n---\n\n")}\n=== FIM DAS SKILLS ===`;
}

export function createSkill(id: string, name: string, instructions: string): { ok: boolean; error?: string; id?: string } {
  const cleanId = id
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!cleanId) return { ok: false, error: "ID de skill inválido." };
  if (!name.trim()) return { ok: false, error: "Nome da skill é obrigatório." };
  if (!instructions.trim()) return { ok: false, error: "Instruções da skill são obrigatórias." };
  const content =
    `# ${name.trim()}\n\n` +
    `## Descrição\n${instructions.trim().split("\n")[0].slice(0, 200)}\n\n` +
    `## Instruções\n${instructions.trim()}\n`;
  const candidates = [join(process.cwd(), "skills"), join(tmpdir(), "jarvis-skills")];
  let lastErr = "";
  for (const dir of candidates) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${cleanId}.md`), content, "utf-8");
      return { ok: true, id: cleanId };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error: `Falha ao salvar skill: ${lastErr.slice(0, 200)}` };
}
