export function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "hoje";
    if (diff === 1) return "ontem";
    if (diff < 7) return `${diff} dias atrás`;
    if (diff < 14) return "1 semana";
    if (diff < 30) return `${Math.floor(diff / 7)} semanas`;
    return d.toLocaleDateString("pt-BR");
}
