
import WebSocket from "ws";

import { runMigrations } from "./database/migrations.mjs";
import { runCombatMigrations } from "./database/combat-migrations.mjs";

import {
    carregarComandos,
    registrarComandos
} from "./registrar.mjs";

import {
    runStreakMigrations
} from "./database/streak-migrations.mjs";

import {
    runDeveloperMigrations
} from "./database/developer-migrations.mjs";

import {
    isOwner,
    userId,
    maintenance,
    blocked
} from "./services/developer.mjs";

import {
    runPlayerNamesMigrations,
    savePlayerName
} from "./services/player-names.mjs";

import {
    runAchievementMigrations
} from "./database/achievement-migrations.mjs";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const API = "https://api.vsync.lat";

const TOKEN = process.env.VSYNC_BOT_TOKEN;

if (!TOKEN) {
    throw new Error(
        "VSYNC_BOT_TOKEN não configurado."
    );
}

const headers = {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json"
};

// ==========================================
// UTILITÁRIOS
// ==========================================

async function responderInteracao(interaction, resultado) {
    const callback = await fetch(
        `${API}/interactions/${interaction.id}/${interaction.token}/callback`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(resultado)
        }
    );

    if (!callback.ok) {
        console.error(
            "[CALLBACK]",
            callback.status,
            await callback.text()
        );
    }

    return callback.ok;
}

function mensagemErro(
    texto = "❌ Ocorreu um erro ao executar esta ação."
) {
    return {
        type: "message",

        data: {
            body: texto,
            ephemeral: true
        }
    };
}

// ==========================================
// ENVIAR MENSAGEM NORMAL AO CANAL
// ==========================================

async function enviarMensagemCanal(interaction, data) {
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;

    if (!guildId || !channelId) {
        throw new Error(
            "Servidor ou canal não identificado."
        );
    }

    const response = await fetch(
        `${API}/guilds/${encodeURIComponent(guildId)}` +
        `/channels/${encodeURIComponent(channelId)}/messages`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        const detail = await response.text();

        throw new Error(
            `[MENSAGEM CANAL] HTTP ${response.status}: ${detail}`
        );
    }

    return response.json();
}

// ==========================================
// EXECUÇÃO ESPECIAL DO /PERFIL
// ==========================================

async function executarPerfil(interaction, comando) {
    // Confirma a interação ANTES de executar
    // Sharp e iniciar o upload.

    const confirmado = await responderInteracao(
        interaction,
        {
            type: "message",
            data: {
                body: "🎨 Gerando seu cartão de perfil...",
                ephemeral: true
            }
        }
    );

    if (!confirmado) {
        console.error(
            "[PERFIL] Não foi possível confirmar a interação."
        );

        return;
    }

    try {
        const resultado = await comando.execute(interaction);

        if (!resultado) {
            console.error(
                "[PERFIL] O comando não retornou uma resposta."
            );

            return;
        }

        // O comando continua retornando:
        //
        // {
        //   type: "message",
        //   data: {
        //     body: "",
        //     attachments: ["att:ID"]
        //   }
        // }
        //
        // Porém, agora enviamos o resultado
        // como mensagem normal ao canal,
        // pois o callback inicial já foi usado.

        if (resultado.type !== "message" || !resultado.data) {
            throw new Error(
                "Formato de resposta inválido no /perfil."
            );
        }

        const data = resultado.data;

        // Evita publicar respostas de erro efêmeras
        // como mensagens públicas no canal.

        if (data.ephemeral) {
            console.error(
                "[PERFIL] O comando retornou um erro:",
                data.body
            );

            return;
        }

        await enviarMensagemCanal(
            interaction,
            {
                body: data.body ?? "",
                ...(data.attachments
                    ? { attachments: data.attachments }
                    : {}),
                ...(data.embeds
                    ? { embeds: data.embeds }
                    : {})
            }
        );

        console.log(
            "[PERFIL] Cartão publicado no canal."
        );

    } catch (erro) {
        console.error(
            "[PERFIL] Falha na execução ou publicação:",
            erro
        );
    }
}

// ==========================================
// AUTENTICAÇÃO
// ==========================================

const resposta = await fetch(
    `${API}/bot/me`,
    {
        headers
    }
);

if (!resposta.ok) {
    throw new Error(
        `Erro de autenticação: ${resposta.status} - ${await resposta.text()}`
    );
}

const me = await resposta.json();

const appId = me.application.id;

// ==========================================
// MIGRAÇÕES
// ==========================================

runMigrations();
runCombatMigrations();
runDeveloperMigrations();
runStreakMigrations();
runPlayerNamesMigrations();
runAchievementMigrations();

// ==========================================
// CARREGAR E REGISTRAR COMANDOS
// ==========================================

const comandos = await carregarComandos();

await registrarComandos(
    appId,
    comandos
);

// ==========================================
// COMPONENTES INTERATIVOS
// ==========================================

async function executarComponente(interaction) {
    const customId = String(
        interaction.data?.customId || ""
    );

    if (customId.startsWith("userinfo:")) {
        console.log(
            "[USERINFO COMPONENT]",
            {
                customId,
                userId: interaction.user?.id,
                values: interaction.data?.values || []
            }
        );

        return {
            type: "message",

            data: {
                body:
                    "💜 Os menus interativos do Userinfo estão em desenvolvimento.",

                ephemeral: true
            }
        };
    }

    console.warn(
        "[COMPONENTE DESCONHECIDO]",
        customId
    );

    return mensagemErro(
        "❌ Este componente não está disponível."
    );
}

// ==========================================
// GATEWAY
// ==========================================

const ws = new WebSocket(
    API.replace(/^http/, "ws") + "/gateway"
);

let heartbeat = null;

// ==========================================
// EVENTOS DO GATEWAY
// ==========================================

ws.on("message", async (raw) => {
    try {
        const msg = JSON.parse(
            raw.toString()
        );

        // ==================================
        // HELLO
        // ==================================

        if (msg.op === "hello") {
            ws.send(
                JSON.stringify({
                    op: "identify",
                    token: TOKEN
                })
            );

            clearInterval(heartbeat);

            heartbeat = setInterval(() => {
                if (
                    ws.readyState === WebSocket.OPEN
                ) {
                    ws.send(
                        JSON.stringify({
                            op: "ping"
                        })
                    );
                }
            }, msg.heartbeatMs);

            return;
        }

        // ==================================
        // READY
        // ==================================

        if (msg.op === "ready") {
            console.log(
                `Online como ${msg.user.displayName}`
            );

            console.log(
                `Comandos carregados: ${comandos.size}`
            );

            return;
        }

        // ==================================
        // FILTRAR INTERAÇÕES
        // ==================================

        if (
            msg.op !== "dispatch" ||
            msg.t !== "INTERACTION_CREATE" ||
            !msg.d
        ) {
            return;
        }

        const interaction = msg.d;

        // ==================================
        // IDENTIFICAR USUÁRIO
        // ==================================

        const actorId = userId(interaction);

        if (interaction.user?.id) {
            savePlayerName(
                interaction.user
            );
        }

        // ==================================
        // PROTEÇÃO DO DESENVOLVEDOR
        // ==================================

        if (
            !isOwner(actorId) &&
            (
                maintenance() ||
                blocked(actorId)
            )
        ) {
            const reason = maintenance()
                ? "🛠️ Helena está em manutenção."
                : "🚫 Seu acesso à Helena foi bloqueado.";

            await responderInteracao(
                interaction,
                mensagemErro(reason)
            );

            return;
        }

        // ==================================
        // LOG DA INTERAÇÃO
        // ==================================

        console.dir(
            {
                ...interaction,
                token: "[OCULTO]"
            },
            {
                depth: 6,
                colors: true
            }
        );

        // ==================================
        // COMPONENTES INTERATIVOS
        // ==================================

        if (interaction.type === "component") {
            let resultado;

            try {
                resultado = await executarComponente(
                    interaction
                );
            } catch (erro) {
                console.error(
                    "[ERRO COMPONENTE]",
                    erro
                );

                resultado = mensagemErro(
                    "❌ Não foi possível processar esta interação."
                );
            }

            await responderInteracao(
                interaction,
                resultado
            );

            return;
        }

        // ==================================
        // FILTRAR COMANDOS
        // ==================================

        if (interaction.type !== "command") {
            return;
        }

        // ==================================
        // LOCALIZAR COMANDO
        // ==================================

        const commandName = interaction.data?.name;

        const comando = comandos.get(commandName);

        if (!comando) {
            console.warn(
                `Comando desconhecido: ${commandName}`
            );

            await responderInteracao(
                interaction,
                mensagemErro(
                    "❌ Este comando não está disponível."
                )
            );

            return;
        }

        // ==================================
        // TRATAMENTO ESPECIAL DO /PERFIL
        // ==================================

        if (commandName === "perfil") {
            await executarPerfil(
                interaction,
                comando
            );

            return;
        }

        // ==================================
        // EXECUTAR DEMAIS COMANDOS
        // ==================================

        let resultado;

        try {
            resultado = await comando.execute(
                interaction
            );

        } catch (erro) {
            console.error(
                `Erro no comando /${comando.name}:`,
                erro
            );

            resultado = {
                type: "message",

                data: {
                    body:
                        "❌ Ocorreu um erro ao executar o comando."
                }
            };
        }

        // ==================================
        // RESPONDER À INTERAÇÃO
        // ==================================

        if (!resultado) {
            console.error(
                `[COMANDO SEM RESPOSTA] /${comando.name}`
            );

            resultado = mensagemErro(
                "❌ O comando não retornou uma resposta válida."
            );
        }
        console.dir(
            {
                comando: comando.name,
                resposta: resultado
            },
            {
                depth: 6,
                colors: true
            }
        );

        await responderInteracao(
            interaction,
            resultado
        );

    } catch (erro) {
        console.error(
            "[ERRO NO GATEWAY]",
            erro
        );
    }
});

// ==========================================
// DESCONEXÃO
// ==========================================

ws.on("close", () => {
    clearInterval(heartbeat);

    heartbeat = null;

    console.log(
        "Gateway desconectado."
    );
});

// ==========================================
// ERROS DO WEBSOCKET
// ==========================================

ws.on("error", (erro) => {
    console.error(
        "[WEBSOCKET]",
        erro
    );
});