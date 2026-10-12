
import {
    getUserBadges,
    getPrismaInfo
} from "../services/userinfo-badges.mjs";

import {
    incrementUserinfoViews
} from "../services/userinfo-views.mjs";

const COLOR = "#8755DA";
const MAX_FIELD = 1024;
const UNKNOWN = "Não informado pela API";

// ==========================================
// UTILITÁRIOS
// ==========================================

function safe(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/([*_`~|>])/g, "\\$1")
        .replace(/@/g, "@\u200b")
        .replace(/\r?\n/g, " ");
}

function errorResponse(message) {
    return {
        type: "message",
        data: {
            body: "❌ " + message,
            ephemeral: true
        }
    };
}

function optionId(interaction) {
    const options = interaction.data?.options;

    if (Array.isArray(options)) {
        const option = options.find(item =>
            ["usuario", "usuário", "user"].includes(item.name)
        );

        return option?.value?.id ??
            option?.value ??
            null;
    }

    return options?.usuario?.id ??
        options?.usuario ??
        options?.user?.id ??
        options?.user ??
        null;
}

function targetUser(interaction) {
    const id = optionId(interaction);

    if (!id) {
        return interaction.user;
    }

    const resolved = interaction.data?.resolved?.users;

    const user = resolved?.[String(id)] ??
        (
            Array.isArray(resolved)
                ? resolved.find(item =>
                    String(item.id) === String(id)
                )
                : null
        );

    if (user) {
        return user;
    }

    return String(interaction.user?.id) === String(id)
        ? interaction.user
        : null;
}

function first(object, keys) {
    for (const key of keys) {
        const value = object?.[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return null;
}

function dateFrom(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "number" ||
        /^\d+$/.test(String(value))
    ) {
        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) {
            return null;
        }

        const date = new Date(
            number < 1e11
                ? number * 1000
                : number
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function dateField(value) {
    const date = dateFrom(value);

    if (!date) {
        return UNKNOWN;
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo"
    }).format(date);
}

function add(fields, name, value, inline = false) {
    fields.push({
        name,
        value: String(value ?? UNKNOWN).slice(0, MAX_FIELD),
        inline
    });
}

// ==========================================
// COMANDO /USERINFO
// ==========================================

export default {
    name: "userinfo",

    description:
        "Veja as informações e insígnias de um usuário do VSync",

    options: [
        {
            name: "usuario",
            description: "Usuário a consultar",
            type: "user",
            required: false
        }
    ],

    async execute(interaction) {
        try {
            // ==================================
            // IDENTIFICAÇÃO
            // ==================================

            const user = targetUser(interaction);

            if (!user?.id) {
                return errorResponse(
                    "Não consegui identificar o usuário selecionado."
                );
            }

            const name = safe(
                user.displayName ||
                user.username ||
                "Usuário"
            );

            const username = safe(
                user.username || "desconhecido"
            );

            const prisma = getPrismaInfo(user);
            const badges = getUserBadges(user);

            // ==================================
            // DATAS DA CONTA
            // ==================================

            const createdAt = dateField(
                first(user, [
                    "createdAt",
                    "created_at",
                    "accountCreatedAt"
                ])
            );

            const joinedAt = dateField(
                first(user, [
                    "joinedAt",
                    "joined_at",
                    "guildJoinedAt",
                    "memberJoinedAt"
                ])
            );

            // ==================================
            // PRISMA+
            // ==================================

            const prismaSince = prisma.active
                ? dateField(
                    first(user, [
                        "prismaSince",
                        "prismaStartedAt",
                        "prismaSubscribedAt",
                        "prismaSubscriptionStartedAt"
                    ])
                )
                : "Não é assinante Prisma+.";

            // ==================================
            // PULSER
            // ==================================

            const pulserSince = prisma.pulsing
                ? dateField(
                    first(user, [
                        "pulseSince",
                        "pulsingSince",
                        "pulseStartedAt"
                    ])
                )
                : "Não possui Pulse ativo.";

            const currentPulseBadge = first(user, [
                "currentPulseBadge",
                "pulseBadge"
            ]);

            const nextPulseBadge = first(user, [
                "nextPulseBadge"
            ]);

            // ==================================
            // CONTADOR DE VISUALIZAÇÕES
            // ==================================

            let views = null;

            try {
                views = await incrementUserinfoViews(
                    user.id
                );
            } catch (viewsError) {
                console.warn(
                    "[USERINFO] Contador indisponível:",
                    viewsError
                );
            }

            // ==================================
            // RODAPÉ
            // ==================================

            const actor = safe(
                interaction.user?.displayName ||
                interaction.user?.username ||
                "Usuário"
            );

            const horario = new Intl.DateTimeFormat(
                "pt-BR",
                {
                    timeZone: "America/Sao_Paulo",
                    dateStyle: "short",
                    timeStyle: "short"
                }
            ).format(new Date());

            const footer =
                "Comando executado por: " +
                actor +
                (
                    views === null
                        ? ""
                        : " | Visualizações: " + views
                ) +
                " • " +
                horario;

            // ==================================
            // CAMPOS DO EMBED
            // ==================================

            const fields = [];

            // 1. MENÇÃO

            add(
                fields,
                "👤 Menção",
                "<@" + user.id + ">"
            );

            // 2. TAG | ID | INSÍGNIAS

            const badgeText = badges
                .map(badge => badge.emoji)
                .filter(Boolean)
                .join(" ");

            add(
                fields,
                "🏷️ Tag",
                username,
                true
            );

            add(
                fields,
                "🪪 ID",
                String(user.id),
                true
            );

            add(
                fields,
                "🏅 Insígnias",
                badgeText || "Nenhuma",
                true
            );

            // 3. CONTA CRIADA EM

            add(
                fields,
                "📅 Conta criada em",
                createdAt
            );

            // 4. ENTROU NO SERVIDOR EM

            add(
                fields,
                "📅 Entrou no servidor em",
                joinedAt
            );

            // 5. ASSINANTE PRISMA+ DESDE

            add(
                fields,
                "💎 Assinante Prisma+ desde",
                prismaSince
            );

            // 6. PULSER DESDE

            add(
                fields,
                "✨ Pulser desde",
                pulserSince
            );

            // 7. INSÍGNIAS PULSER LADO A LADO

            add(
                fields,
                "🏅 Insígnia de Pulser atual",
                currentPulseBadge ?? UNKNOWN,
                true
            );

            add(
                fields,
                "⏭️ Próxima insígnia de Pulser",
                nextPulseBadge ?? UNKNOWN,
                true
            );

            // ==================================
            // EMBED FINAL
            // ==================================

            const embed = {
                author: {
                    name: name + " (" + username + ")",
                    ...(user.avatarUrl
                        ? { iconUrl: user.avatarUrl }
                        : {})
                },

                color: COLOR,

                // Mantém o avatar maior à direita, se desejar.
                thumbnail: user.avatarUrl
                    ? {
                        url: user.avatarUrl
                    }
                    : undefined,

                fields,

                footer: {
                    text: footer
                }
            };
            // ==================================
            // RESPOSTA
            // ==================================

            return {
                type: "message",
                data: {
                    body: "",
                    embeds: [embed]
                }
            };

        } catch (error) {
            console.error(
                "[USERINFO]",
                error
            );

            return errorResponse(
                "Não foi possível carregar as informações deste usuário."
            );
        }
    }
};