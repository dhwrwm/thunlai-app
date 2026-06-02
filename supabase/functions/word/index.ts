import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const [{ data: word }, { data: audio }] = await Promise.all([
    supabase
      .from('words')
      .select('id, bodo, roman, english, source, slug')
      .eq('id', Number(id))
      .single(),
    supabase
      .from('words_audio')
      .select('audio_url, duration_ms')
      .eq('word_id', Number(id))
      .single(),
  ]);

  if (!word) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ...word, audio: audio ?? null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
