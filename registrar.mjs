
import { readdir } from "node:fs/promises";

const API = "https://api.vsync.lat";
const TOKEN = process.env.VSYNC_BOT_TOKEN;

const headers = {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json"
};

export async function carregarComandos() {
    const comandos = new Map();

    const arquivos = await readdir(
        new URL("./commands/", import.meta.url)
    );

    for (const arquivo of arquivos) {
        if (!arquivo.endsWith(".mjs")) continue;

        const modulo = await import(
            new URL(`./commands/${arquivo}`, import.meta.url)
        );

        const comando = modulo.default;

        if (!comando?.name || typeof comando.execute !== "function") {
            console.warn(`Comando inválido: ${arquivo}`);
            continue;
        }

        comandos.set(comando.name, comando);
    }

    return comandos;
}

export async function registrarComandos(appId, comandos) {
    const payload = [...comandos.values()].map(
        ({ name, description, options }) => ({
            name,
            description,
            ...(options ? { options } : {})
        })
    );

    const resposta = await fetch(
        `${API}/applications/${appId}/commands`,
        {
            method: "PUT",
            headers,
            body: JSON.stringify(payload)
        }
    );

    if (!resposta.ok) {
        throw new Error(
            `Erro ao registrar comandos: ${resposta.status} - ${await resposta.text()}`
        );
    }

    console.log(`${payload.length} comandos registrados!`);
}