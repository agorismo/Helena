import { db } from "../database/connection.mjs";
import { status, tx, now } from "./combat.mjs";
import { getPlayer } from "../database/economy.mjs";
export function heal(g, u) { return tx(() => { const s = status(g, u); if (s.hp >= 100) throw Error("Sua vida já está cheia."); getPlayer(g, u); const cost = (100 - s.hp) * 100; const r = db.prepare("UPDATE players SET wallet=wallet-? WHERE guild_id=? AND user_id=? AND wallet>=?").run(cost, g, u, cost); if (!r.changes) throw Error("Carteira insuficiente."); db.prepare("UPDATE combat_players SET hp=100,protected_until=? WHERE guild_id=? AND user_id=?").run(now() + 600, g, u); return cost; }); }
