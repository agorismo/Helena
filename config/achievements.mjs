
// ==========================================
// HELENA 2.0
// CONFIGURAÇÃO DE CONQUISTAS E TÍTULOS
// ==========================================

export const ACHIEVEMENT_RARITIES = Object.freeze({
    common: {
        name: "Comum",
        emoji: "⚪"
    },

    uncommon: {
        name: "Incomum",
        emoji: "🟢"
    },

    rare: {
        name: "Raro",
        emoji: "🔵"
    },

    epic: {
        name: "Épico",
        emoji: "🟣"
    },

    legendary: {
        name: "Lendário",
        emoji: "🟡"
    }
});

// ==========================================
// CONQUISTAS DISPONÍVEIS
// ==========================================

export const ACHIEVEMENTS = Object.freeze({
    // ======================================
    // PROGRESSÃO
    // ======================================

    first_steps: {
        id: "first_steps",
        name: "Primeiros Passos",
        description: "Alcance o nível 2.",
        emoji: "🌱",
        rarity: "common",

        title: "Iniciante",
        titleEmoji: "🌱",

        requirement: {
            type: "level",
            target: 2
        }
    },

    veteran: {
        id: "veteran",
        name: "Veterano",
        description: "Alcance o nível 10.",
        emoji: "🏆",
        rarity: "rare",

        title: "Veterano",
        titleEmoji: "🏆",

        requirement: {
            type: "level",
            target: 10
        }
    },

    elite: {
        id: "elite",
        name: "Elite da Helena",
        description: "Alcance o nível 25.",
        emoji: "👑",
        rarity: "legendary",

        title: "Elite",
        titleEmoji: "👑",

        requirement: {
            type: "level",
            target: 25
        }
    },

    // ======================================
    // ECONOMIA
    // ======================================

    first_savings: {
        id: "first_savings",
        name: "Primeiras Economias",
        description: "Acumule R$ 1.000 em patrimônio.",
        emoji: "💵",
        rarity: "common",

        title: "Poupador",
        titleEmoji: "💵",

        requirement: {
            type: "wealth",
            target: 100_000
        }
    },

    rich: {
        id: "rich",
        name: "Vida de Rico",
        description: "Acumule R$ 10.000 em patrimônio.",
        emoji: "💰",
        rarity: "rare",

        title: "Rico",
        titleEmoji: "💰",

        requirement: {
            type: "wealth",
            target: 1_000_000
        }
    },

    magnate: {
        id: "magnate",
        name: "Magnata",
        description: "Acumule R$ 100.000 em patrimônio.",
        emoji: "💎",
        rarity: "legendary",

        title: "Magnata",
        titleEmoji: "💎",

        requirement: {
            type: "wealth",
            target: 10_000_000
        }
    },

    // ======================================
    // DAILY STREAK
    // ======================================

    daily_3: {
        id: "daily_3",
        name: "Começando Bem",
        description: "Alcance 3 dias de sequência diária.",
        emoji: "🔥",
        rarity: "common",

        title: "Persistente",
        titleEmoji: "🔥",

        requirement: {
            type: "streak",
            target: 3
        }
    },

    daily_7: {
        id: "daily_7",
        name: "Uma Semana de Dedicação",
        description: "Alcance 7 dias de sequência diária.",
        emoji: "🔥",
        rarity: "rare",

        title: "Dedicado",
        titleEmoji: "🔥",

        requirement: {
            type: "streak",
            target: 7
        }
    },

    daily_30: {
        id: "daily_30",
        name: "Disciplina Absoluta",
        description: "Alcance 30 dias de sequência diária.",
        emoji: "🌟",
        rarity: "legendary",

        title: "Imparável",
        titleEmoji: "🌟",

        requirement: {
            type: "streak",
            target: 30
        }
    },

    // ======================================
    // COMBATE
    // ======================================

    duelist: {
        id: "duelist",
        name: "Duelista",
        description: "Vença 10 duelos.",
        emoji: "⚔️",
        rarity: "rare",

        title: "Duelista",
        titleEmoji: "⚔️",

        requirement: {
            type: "duel_wins",
            target: 10
        }
    },

    champion: {
        id: "champion",
        name: "Campeão da Arena",
        description: "Vença 50 duelos.",
        emoji: "🏅",
        rarity: "epic",

        title: "Campeão",
        titleEmoji: "🏅",

        requirement: {
            type: "duel_wins",
            target: 50
        }
    },

    // ======================================
    // GEMAS
    // ======================================

    gem_collector: {
        id: "gem_collector",
        name: "Colecionador de Gemas",
        description: "Acumule 100 gemas.",
        emoji: "💎",
        rarity: "uncommon",

        title: "Colecionador",
        titleEmoji: "💎",

        requirement: {
            type: "gems",
            target: 100
        }
    }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export function getAchievement(id) {
    return ACHIEVEMENTS[id] || null;
}

export function getAllAchievements() {
    return Object.values(ACHIEVEMENTS);
}

export function getAchievementsByType(type) {
    return getAllAchievements().filter(
        achievement =>
            achievement.requirement.type === type
    );
}

export function getAchievementRarity(achievement) {
    if (!achievement) {
        return ACHIEVEMENT_RARITIES.common;
    }

    return (
        ACHIEVEMENT_RARITIES[achievement.rarity] ||
        ACHIEVEMENT_RARITIES.common
    );
}

export function formatAchievementTitle(achievement) {
    if (!achievement) {
        return null;
    }

    return (
        achievement.titleEmoji +
        " " +
        achievement.title
    );
}