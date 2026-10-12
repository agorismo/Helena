import { db } from "./connection.mjs";
export function runCombatMigrations() {
    db.exec(`CREATE TABLE IF NOT EXISTS combat_players (guild_id TEXT NOT NULL,user_id TEXT NOT NULL,hp INTEGER NOT NULL DEFAULT 100,protected_until INTEGER NOT NULL DEFAULT 0,wins INTEGER NOT NULL DEFAULT 0,losses INTEGER NOT NULL DEFAULT 0,last_duel INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id));
 CREATE TABLE IF NOT EXISTS combat_challenges (guild_id TEXT NOT NULL,target_id TEXT NOT NULL,sender_id TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(guild_id,target_id));
 CREATE TABLE IF NOT EXISTS combat_history (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,winner_id TEXT NOT NULL,loser_id TEXT NOT NULL,damage INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS combat_gear (guild_id TEXT NOT NULL,user_id TEXT NOT NULL,ammo INTEGER NOT NULL DEFAULT 0,vest INTEGER NOT NULL DEFAULT 0,durability INTEGER NOT NULL DEFAULT 100,PRIMARY KEY(guild_id,user_id));
 CREATE TABLE IF NOT EXISTS combat_admin_log (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,admin_id TEXT NOT NULL,target_id TEXT NOT NULL,action TEXT NOT NULL,details TEXT NOT NULL,created_at INTEGER NOT NULL);`);
}
