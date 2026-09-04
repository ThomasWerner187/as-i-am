/** Agent activity timeline — human-readable, JSON collapsible. */

export interface ActivityEntry {
  id: number;
  at: string;
  tool: string;
  summary: string;
  detail?: string; // collapsible raw JSON
}

let entries: ActivityEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const activity = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  log(): ActivityEntry[] {
    return entries;
  },
  push(tool: string, summary: string, detail?: string): void {
    entries = [...entries, { id: nextId++, at: new Date().toISOString(), tool, summary, detail }].slice(-40);
    emit();
  },
  clear(): void {
    entries = [];
    emit();
  },
};
