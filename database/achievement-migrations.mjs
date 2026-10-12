
import { db } from "./connection.mjs";

export function runAchievementMigrations() {

    db.exec(`
        CREATE TABLE IF NOT EXISTS player_achievements (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            achievement_id TEXT NOT NULL,

            unlocked_at INTEGER NOT NULL
                DEFAULT (unixepoch()),

            PRIMARY KEY (
                guild_id,
                user_id,
                achievement_id
            )
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS player_titles (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            equipped_title TEXT DEFAULT NULL,

            updated_at INTEGER NOT NULL
                DEFAULT (unixepoch()),

            PRIMARY KEY (
                guild_id,
                user_id
            )
        );
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS
            idx_player_achievements_user

        ON player_achievements (
            guild_id,
            user_id
        );
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS
            idx_player_achievements_type

        ON player_achievements (
            achievement_id
        );
    `);

    console.log(
        "[DATABASE] Sistema de conquistas e títulos verificado."
    );
}