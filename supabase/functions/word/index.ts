import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: 'id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sql = neon(Deno.env.get('DATABASE_URL')!);

  const [words, recordings] = await Promise.all([
    sql`SELECT id, bodo, roman, english, source, slug FROM words WHERE id = ${Number(id)}`,
    sql`SELECT storage_path, duration_ms FROM recordings WHERE word_id = ${Number(id)} AND status = 'approved' LIMIT 1`,
  ]);

  const word = words[0];
  if (!word) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rec = recordings[0];
  const audio = rec
    ? {
        audio_url: `${SUPABASE_URL}/storage/v1/object/public/audio/${rec.storage_path}`,
        duration_ms: rec.duration_ms,
      }
    : null;

  return new Response(JSON.stringify({ ...word, audio }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
