import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  nightsSurvived: integer("nights_survived").notNull(),
  score: integer("score").notNull(),
});

export const insertScoreSchema = createInsertSchema(scores).omit({ id: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
