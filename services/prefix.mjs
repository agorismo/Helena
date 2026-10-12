
import {
    isOwner,
    maintenance,
    blocked
} from "./developer.mjs";

import {
    savePlayerName
} from "./player-names.mjs";

export const PREFIX = "h";

function tokenize(input) {
    return input.match(/"[^"]*"|'[^']*'|\S+/g)
        ?.map(value => {
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                return value.slice(1, -1);
            }

            return value;
        }) ?? [];
}

function convertOption(value, definition) {
    if (value === undefined) {
        return undefined;
    }

    switch (definition.type) {
        case "integer": {
            const number = Number(value);

            if (!Number.isSafeInteger(number)) {
                throw new Error(
                    `A opção "${definition.name}" precisa ser um número inteiro.`
                );
            }

            return number;
        }

        case "number": {
            const number = Number(value);

            if (!Number.isFinite(number)) {
                throw new Error(
                    `A opção "${definition.name}" precisa ser um número.`
                );
            }

            return number;
        }

        case "boolean":
            if (["true", "sim", "1"].includes(value.toLowerCase())) {
                return true;
            }

            if (["false", "não", "nao", "0"].includes(value.toLowerCase())) {
                return false;
            }

            throw new Error(
                `A opção "${definition.name}" precisa ser sim ou não.`
            );

        default:
            return value;
    }
}

function parseOptions(args, definitions = []) {
    const options = [];

    for (let index = 0; index < definitions.length; index++) {
        const definition = definitions[index];
        const raw = args[index];

        if (raw === undefined) {
            if (definition.required) {
                throw new Error(
                    `Faltou a opção "${definition.name}".`
                );
            }

            continue;
        }

        const value = convertOption(raw, definition);

        if (
            Array.isArray(definition.choices) &&
            !definition.choices.some(choice => choice.value === value)
        ) {
            throw new Error(
                `Valor inválido para "${definition.name}". Opções: ${
                    definition.choices.map(choice => choice.value).join(", ")
                }`
            );
        }

        options.push({
            name: definition.name,
            type: definition.type,
            value
        });
    }

    if (args.length > definitions.length) {
        throw new Error(
            "Foram informados mais argumentos do que o comando aceita."
        );
    }

    return options;
}

export async function processarPrefixo({
    message,
    comandos,
    send
}) {
    const body = String(message.body ?? "").trim();

    if (!body.toLowerCase().startsWith(PREFIX)) {
        return false;
    }

    const parts = tokenize(body.slice(PREFIX.length));

    const commandName = parts.shift()?.toLowerCase();

    if (!commandName) {
        return false;
    }

    const comando = comandos.get(commandName);

    if (!comando) {
        return false;
    }

    const user = message.author ?? message.user;

    if (!user?.id || !message.guildId || !message.channelId) {
        console.warn(
            "[PREFIX] Mensagem sem usuário, servidor ou canal reconhecido."
        );

        return true;
    }

    // Impede que o bot execute suas próprias mensagens.
    if (user.bot === true) {
        return true;
    }

    const actorId = String(user.id);

    if (!isOwner(actorId)) {
        if (maintenance()) {
            await send(message, {
                body: "🛠️ Helena está em manutenção."
            });

            return true;
        }

        if (blocked(actorId)) {
            await send(message, {
                body: "🚫 Seu acesso à Helena foi bloqueado."
            });

            return true;
        }
    }

    savePlayerName(user);

    let options;

    try {
        options = parseOptions(
            parts,
            comando.options ?? []
        );
    } catch (error) {
        await send(message, {
            body: `❌ ${error.message}`
        });

        return true;
    }

    // Adaptador: mantém o formato que os comandos
    // slash já esperam receber.
    const interaction = {
        id: message.id,
        type: "command",
        guildId: message.guildId,
        channelId: message.channelId,
        user,
        data: {
            name: commandName,
            options
        }
    };

    try {
        if (commandName === "perfil") {
            await send(message, {
                body: "🎨 Gerando seu cartão de perfil..."
            });
        }

        const result = await comando.execute(interaction);

        if (result?.type !== "message" || !result.data) {
            throw new Error(
                "O comando não retornou uma resposta compatível."
            );
        }

        const data = result.data;

        await send(message, {
            body: data.body ?? "",
            ...(data.embeds ? { embeds: data.embeds } : {}),
            ...(data.attachments ? { attachments: data.attachments } : {})
        });

        return true;

    } catch (error) {
        console.error(
            `[PREFIX] Erro em h${commandName}:`,
            error
        );

        await send(message, {
            body: "❌ Ocorreu um erro ao executar este comando."
        });

        return true;
    }
}