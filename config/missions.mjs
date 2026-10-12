
export const MISSIONS = Object.freeze([
    {
        id: "work",
        name: "Trabalhador dedicado",
        description: "Trabalhe 2 vezes",
        event: "work",
        target: 2,
        reward: 30000,
        xp: 40,
        emoji: "💼"
    },
    {
        id: "deposit",
        name: "Organização financeira",
        description: "Deposite dinheiro 2 vezes",
        event: "deposit",
        target: 2,
        reward: 20000,
        xp: 25,
        emoji: "🏦"
    },
    {
        id: "daily",
        name: "Presença diária",
        description: "Resgate sua recompensa diária",
        event: "daily",
        target: 1,
        reward: 15000,
        xp: 20,
        emoji: "🎁"
    }
]);

export function getMission(id) {
    return MISSIONS.find(mission => mission.id === id);
}

// Dia UTC. A virada acontece à meia-noite UTC.
export function getMissionPeriod(
    now = Date.now()
) {
    return new Date(now).toISOString().slice(0, 10);
}