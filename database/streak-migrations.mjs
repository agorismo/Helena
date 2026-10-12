
import { db } from "./connection.mjs";

// ==========================================
// MIGRAÇÃO DO SISTEMA DE STREAK
// ==========================================

export function runStreakMigrations() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_streaks (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            streak INTEGER NOT NULL DEFAULT 0
                CHECK (streak >= 0),

            best_streak INTEGER NOT NULL DEFAULT 0
                CHECK (best_streak >= 0),

            last_claim_day TEXT,

            total_claims INTEGER NOT NULL DEFAULT 0
                CHECK (total_claims >= 0),

            PRIMARY KEY (guild_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_daily_streaks_user
        ON daily_streaks(user_id);
    `);

    console.log(
        "[DATABASE] Sistema de streak diário verificado."
    );
}