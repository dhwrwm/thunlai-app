import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { words } from "../src/schema.ts";

const db = drizzle(neon(process.env.DATABASE_URL!));

async function seed() {
  const res = await fetch(
    "https://raw.githubusercontent.com/bihungorg/bihung/main/data.json",
  );
  const { words: entries } = await res.json();

  const allWords = (entries as any[])
    .map((e) => {
      if (e.s === "dictionary") {
        // Bodo → English: `word` is Devanagari Bodo, `e[]` are English meanings
        return {
          bodo: e.word as string,
          roman: "",
          english: (e.e as string[]).join("; "),
          source: "dictionary",
          slug: null,
        };
      } else {
        // Glossary (English → Bodo): `word` is English, `b[]` are Bodo translations
        return {
          bodo: (e.b as string[])[0] ?? "",
          roman: "",
          english: e.word as string,
          source: e.s as string,
          slug: null,
        };
      }
    })
    .filter((w) => w.bodo.trim() && w.english.trim());

  const BATCH = 500;
  for (let i = 0; i < allWords.length; i += BATCH) {
    await db
      .insert(words)
      .values(allWords.slice(i, i + BATCH))
      .onConflictDoNothing();
    console.log(`${Math.min(i + BATCH, allWords.length)}/${allWords.length}`);
  }

  console.log(`Done. Inserted up to ${allWords.length} words.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
