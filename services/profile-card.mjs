
import sharp from "sharp";

const W = 1500;
const H = 900;

// ==========================================
// UTILITÁRIOS
// ==========================================

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function short(value, max = 60) {
    const text = String(value ?? "");

    return text.length > max
        ? text.slice(0, max - 1) + "…"
        : text;
}

function money(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(value) || 0);
}

function txt(
    x,
    y,
    value,
    size = 28,
    color = "#f6edff",
    weight = 500,
    extra = ""
) {
    return `
        <text
            x="${x}"
            y="${y}"
            font-family="DejaVu Sans, sans-serif"
            font-size="${size}"
            font-weight="${weight}"
            fill="${color}"
            ${extra}
        >${esc(value)}</text>
    `;
}

function rect(
    x,
    y,
    width,
    height,
    fill = "#100c27",
    stroke = "#6934bd",
    radius = 22
) {
    return `
        <rect
            x="${x}"
            y="${y}"
            width="${width}"
            height="${height}"
            rx="${radius}"
            fill="${fill}"
            stroke="${stroke}"
            stroke-width="2"
        />
    `;
}

function panel(
    x,
    y,
    width,
    height,
    label,
    value,
    detail = ""
) {
    return `
        ${rect(x, y, width, height)}

        ${txt(
            x + 22,
            y + 36,
            label,
            22,
            "#bd95f5",
            600
        )}

        ${txt(
            x + 22,
            y + 81,
            short(value, 29),
            30,
            "#ffffff",
            700
        )}

        ${
            detail
                ? txt(
                    x + 22,
                    y + 112,
                    short(detail, 42),
                    19,
                    "#bda6dc"
                )
                : ""
        }
    `;
}

// ==========================================
// CARREGAMENTO DE AVATARES
// ==========================================

async function imageData(url) {
    if (
        !url ||
        typeof url !== "string" ||
        !/^https:\/\//.test(url)
    ) {
        return null;
    }

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(6000)
        });

        if (!response.ok) {
            return null;
        }

        const input = Buffer.from(
            await response.arrayBuffer()
        );

        if (input.length > 5_000_000) {
            return null;
        }

        const png = await sharp(input)
            .resize(210, 210, {
                fit: "cover"
            })
            .png()
            .toBuffer();

        return `data:image/png;base64,${png.toString("base64")}`;

    } catch (error) {
        console.warn(
            "[PROFILE CARD] Avatar indisponível:",
            error.message
        );

        return null;
    }
}

// ==========================================
// GERADOR DO CARTÃO
// ==========================================

export async function renderProfileCard(data = {}) {
    const level = Math.max(
        1,
        Number(data.level) || 1
    );

    const maxLevel = Math.max(
        level,
        Number(data.maxLevel) || 100
    );

    const xp = Math.max(
        0,
        Number(data.xpProgress) || 0
    );

    const needed = Math.max(
        1,
        Number(data.xpRequired) || 1
    );

    const ratio = level >= maxLevel
        ? 1
        : Math.min(1, xp / needed);

    // Avatares
    const avatar = await imageData(data.avatarUrl);

    const spouseAvatar = await imageData(
        data.spouseAvatarUrl
    );

    // Identidade
    const name = short(
        data.name || "Jogador",
        22
    );

    const bio = short(
        data.bio || "Nenhuma bio definida.",
        115
    );

    const bioLines = bio.match(
        /.{1,56}(?:\s|$)|.{1,56}/g
    )?.slice(0, 3).map(
        line => line.trim()
    ) || [];

    const spouse = data.spouseName
        ? "@" + String(data.spouseName).replace(/^@+/, "")
        : "—";

    // ======================================
    // SVG DO PERFIL
    // ======================================

    const svg = `
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${W}"
        height="${H}"
        viewBox="0 0 ${W} ${H}"
    >

        <defs>
            <linearGradient
                id="bg"
                x2="1"
                y2="1"
            >
                <stop stop-color="#100823"/>
                <stop offset=".55" stop-color="#210c42"/>
                <stop offset="1" stop-color="#090817"/>
            </linearGradient>

            <linearGradient
                id="banner"
                x2="1"
                y2="0"
            >
                <stop stop-color="#422075"/>
                <stop offset=".5" stop-color="#27104f"/>
                <stop offset="1" stop-color="#0a0a26"/>
            </linearGradient>

            <clipPath id="avatar">
                <circle cx="133" cy="142" r="86"/>
            </clipPath>

            <clipPath id="spouse">
                <circle cx="1055" cy="748" r="32"/>
            </clipPath>
        </defs>

        <!-- FUNDO -->

        <rect
            width="1500"
            height="900"
            fill="url(#bg)"
        />

        <rect
            x="20"
            y="20"
            width="1460"
            height="860"
            rx="30"
            fill="none"
            stroke="#a04ff1"
            stroke-width="4"
        />

        <!-- BANNER -->

        <rect
            x="36"
            y="36"
            width="1428"
            height="224"
            rx="24"
            fill="url(#banner)"
        />

        <circle
            cx="1290"
            cy="100"
            r="57"
            fill="#b87bfa"
            opacity=".18"
        />

        <circle
            cx="1290"
            cy="100"
            r="43"
            fill="#e9d4ff"
            opacity=".7"
        />

        ${txt(
            1370,
            214,
            "HELENA",
            24,
            "#dcb9ff",
            700,
            'text-anchor="end" letter-spacing="6"'
        )}

        <!-- AVATAR -->

        <circle
            cx="133"
            cy="142"
            r="92"
            fill="#9b55e9"
        />

        ${
            avatar
                ? `
                    <image
                        href="${avatar}"
                        x="47"
                        y="56"
                        width="172"
                        height="172"
                        clip-path="url(#avatar)"
                    />
                `
                : `
                    <circle
                        cx="133"
                        cy="142"
                        r="86"
                        fill="#5e3993"
                    />

                    ${txt(
                        133,
                        162,
                        "★",
                        75,
                        "#ffffff",
                        700,
                        'text-anchor="middle"'
                    )}
                `
        }

        <!-- NOME E TÍTULO -->

        ${txt(
            252,
            121,
            name,
            48,
            "#ffffff",
            700
        )}

        ${
            data.isOwner
                ? txt(
                    252,
                    164,
                    "DEV",
                    24,
                    "#f5c66d",
                    700
                )
                : ""
        }

        ${txt(
            252,
            210,
            short(
                data.title || "Sem título equipado",
                37
            ),
            25,
            "#d6b4ff",
            600
        )}

        <!-- PAINEL LATERAL -->

        ${rect(
            42,
            283,
            210,
            560,
            "#150b32",
            "#5d2e9c"
        )}

        ${txt(68, 331, "HELENA", 29, "#d3a6ff", 700)}
        ${txt(68, 380, "PERFIL", 24, "#b78cfa", 600)}

        ${txt(68, 464, "✦", 60, "#bb77ff", 700)}

        ${txt(
            68,
            535,
            "Sua história.",
            21,
            "#bd9aef"
        )}

        ${txt(
            68,
            565,
            "Seu progresso.",
            21,
            "#bd9aef"
        )}

        <!-- ECONOMIA -->

        ${panel(
            278,
            283,
            300,
            130,
            "BANCO",
            money(data.bank)
        )}

        ${panel(
            596,
            283,
            300,
            130,
            "CARTEIRA",
            money(data.wallet)
        )}

        ${panel(
            914,
            283,
            240,
            130,
            "GEMAS",
            Number(data.gems || 0).toLocaleString("pt-BR")
        )}

        <!-- NÍVEL -->

        ${rect(
            1172,
            283,
            290,
            274
        )}

        ${txt(
            1193,
            323,
            `NÍVEL ${level}/${maxLevel}`,
            27,
            "#ffffff",
            700
        )}

        <rect
            x="1194"
            y="356"
            width="246"
            height="22"
            rx="11"
            fill="#39225e"
        />

        <rect
            x="1194"
            y="356"
            width="${246 * ratio}"
            height="22"
            rx="11"
            fill="#aa66f2"
        />

        ${txt(
            1193,
            418,
            level >= maxLevel
                ? "Nível máximo!"
                : `${xp.toLocaleString("pt-BR")} / ${needed.toLocaleString("pt-BR")} XP`,
            22,
            "#c99cf8",
            600
        )}

        ${txt(
            1193,
            456,
            "XP total",
            19,
            "#bda6dc"
        )}

        ${txt(
            1193,
            490,
            Number(data.totalXp || 0).toLocaleString("pt-BR"),
            27,
            "#ffffff",
            700
        )}

        <!-- EMPREGO -->

        ${panel(
            278,
            433,
            300,
            150,
            "EMPREGO ATUAL",
            data.job || "Desempregado(a)"
        )}

        <!-- ARMA -->

        ${panel(
            596,
            433,
            558,
            150,
            "ARMA EQUIPADA",
            data.weapon || "Nenhuma",
            data.weaponDetail || ""
        )}

        <!-- BIO -->

        ${rect(
            278,
            604,
            690,
            239
        )}

        ${txt(
            303,
            649,
            "BIO",
            27,
            "#c997fa",
            700
        )}

        ${
            bioLines.map(
                (line, index) => txt(
                    303,
                    700 + index * 35,
                    line,
                    24,
                    "#f0ddff",
                    400
                )
            ).join("")
        }

        <!-- CASAMENTO -->

        ${rect(
            988,
            604,
            474,
            239
        )}

        ${txt(
            1012,
            646,
            "ESTADO CIVIL",
            25,
            "#c997fa",
            700
        )}

        ${txt(
            1012,
            690,
            data.married
                ? "Casado(a) ♥"
                : "Solteiro(a) ♡",
            28,
            "#ffffff",
            700
        )}

        ${
            spouseAvatar
                ? `
                    <image
                        href="${spouseAvatar}"
                        x="1023"
                        y="716"
                        width="64"
                        height="64"
                        clip-path="url(#spouse)"
                    />
                `
                : ""
        }

        ${txt(
            spouseAvatar ? 1101 : 1012,
            752,
            `Cônjuge: ${short(spouse, 23)}`,
            24,
            "#dcb7ff",
            600
        )}

        <!-- RODAPÉ -->

        ${txt(
            750,
            865,
            "Helena • Sua identidade, sua história.",
            19,
            "#b88de9",
            500,
            'text-anchor="middle"'
        )}

    </svg>
    `;

    // ======================================
    // CONVERSÃO SVG -> PNG
    // ======================================

    return sharp(
        Buffer.from(svg)
    )
        .png()
        .toBuffer();
}