import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const source = url.searchParams.get('source');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '30'), 100);
  const offset = Number(url.searchParams.get('offset') ?? '0');

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sql = neon(Deno.env.get('DATABASE_URL')!);
  const like = `%${q}%`;

  try {
    const rows = source
      ? await sql`
          SELECT id, bodo, roman, english, source, slug
          FROM words
          WHERE (bodo ILIKE ${like} OR roman ILIKE ${like} OR english ILIKE ${like})
            AND source = ${source}
          ORDER BY source
          LIMIT ${limit} OFFSET ${offset}`
      : await sql`
          SELECT id, bodo, roman, english, source, slug
          FROM words
          WHERE bodo ILIKE ${like} OR roman ILIKE ${like} OR english ILIKE ${like}
          ORDER BY source
          LIMIT ${limit} OFFSET ${offset}`;

    return new Response(JSON.stringify(rows), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
