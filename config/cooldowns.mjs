
export const COOLDOWNS = Object.freeze({
    daily: {
        name: "Recompensa diária",
        command: "/daily",
        column: "last_daily",
        duration: 24 * 60 * 60,
        emoji: "🎁"
    },

    work: {
        name: "Trabalho",
        command: "/trabalhar",
        column: "last_work",
        duration: 60 * 60,
        emoji: "💼"
    }
});

export function getRemaining(
    lastUsed,
    duration,
    now = Math.floor(Date.now() / 1000)
) {
    if (
        !Number.isSafeInteger(lastUsed) ||
        lastUsed <= 0
    ) {
        return 0;
    }

    return Math.max(
        0,
        lastUsed + duration - now
    );
}

export function formatCooldown(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));

    if (seconds === 0) {
        return "Disponível";
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    // Exibe segundos quando falta menos de um minuto.
    if (parts.length === 0) {
        parts.push(`${secs}s`);
    }

    return parts.join(" ");
}