// Sistema de níveis de líder — nomes alinhados ao mundo de Formando Líderes.
// 10 níveis (até 2000 XP) baseados nos thresholds existentes em useUserXp.

export const LEVEL_THRESHOLDS = [0, 50, 125, 250, 400, 600, 850, 1150, 1500, 2000];

export const LEVEL_NAMES: Record<number, string> = {
  1: "Líder Iniciante",
  2: "Líder Iniciante",
  3: "Líder Ativo",
  4: "Líder Ativo",
  5: "Líder Destaque",
  6: "Líder Destaque",
  7: "Líder Destaque",
  8: "Líder Elite",
  9: "Líder Elite",
  10: "Líder Lendário",
};

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] || "Líder";
}
