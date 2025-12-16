import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.32.0";

interface ConversationRow {
  id: string;
  recording_url: string | null;
  created_by: string | null;
}

console.info('enqueue-transcriptions started');

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    // 1) Select conversations in FILE_READY
    const { data: convs, error: selErr } = await supabase
      .from<ConversationRow>('conversations')
      .select('id, recording_url, created_by')
      .eq('state', 'TRANSCRIPTION_READY')
      .limit(10);

    if (selErr) throw selErr;
    if (!convs || convs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No FILE_READY conversations' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const enqueued: string[] = [];
    // For each conversation, call a Postgres RPC to enqueue into pgmq queue
    for (const c of convs) {
      // Prepare payload
      const payload = {
        conversation_id: c.id,
        recording_url: c.recording_url,
        created_by: c.created_by
      };

      const { data, error: rpcErr } = await supabase
        .schema('pgmq_public')
        .rpc('send', {
          queue_name: 'feedback_queue',
          message: payload,
          sleep_seconds: 0,
        })

      if (rpcErr) {
        console.error('Failed to publish to queue', rpcErr)
        continue;
      }

      const { error: updErr } = await supabase
        .from('conversations')
        .update({ state: 'FEEDBACK_GENERATION_QUEUED', updated_at: new Date().toISOString() })
        .eq('id', c.id);
      if (updErr) console.warn('Failed to update state for', c.id, updErr);

      enqueued.push(c.id);
    }

    return new Response(JSON.stringify({ processed: enqueued.length, enqueued }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error in enqueue-feedback-generation', err);
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});