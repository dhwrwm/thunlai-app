import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const source = url.searchParams.get('source'); // 'dictionary' | 'glossary' | null
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '30'), 100);
  const offset = Number(url.searchParams.get('offset') ?? '0');

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Use FTS for multi-word queries, ILIKE for short prefix searches
  let query = supabase
    .from('words')
    .select('id, bodo, roman, english, source, slug');

  if (source) query = query.eq('source', source);

  // FTS: wrap each token with prefix matching
  const ftsQuery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `'${t.replace(/'/g, "''")}'`)
    .join(' | ');

  const { data: ftsData, error: ftsErr } = await query
    .textSearch('fts', ftsQuery, { type: 'websearch', config: 'simple' })
    .range(offset, offset + limit - 1);

  if (!ftsErr && ftsData && ftsData.length > 0) {
    return new Response(JSON.stringify(ftsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fallback: ILIKE across all three columns
  const like = `%${q}%`;
  const { data, error } = await supabase
    .from('words')
    .select('id, bodo, roman, english, source, slug')
    .or(`bodo.ilike.${like},roman.ilike.${like},english.ilike.${like}`)
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data ?? []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
