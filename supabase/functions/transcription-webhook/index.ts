import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.32.0'

interface FalWebhookPayload {
    request_id: string
    status: string
    error: string | null
    payload?: {
        text: string
        chunks?: Array<{
            text: string
            timestamp: [number, number]
        }>
    }
}

console.info('transcription-webhook started')

Deno.serve(async (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
    })

    try {
        // Parse webhook payload from fal.ai
        const payload: FalWebhookPayload = await req.json()

        console.info('Received webhook from fal.ai', {
            status: payload.status,
            requestId: payload.request_id,
        })

        const { data: conversation, error: conversationSelectError } = await supabase
            .from('conversations')
            .select('*')
            .eq('transcription_fal_request_id', payload.request_id)
            .single()

        if (conversationSelectError) {
          console.error('Error while getting conversation by transcription_fal_request_id', {
            requestId: payload.request_id,
            error: conversationSelectError,
          })
          return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        const conversationId = conversation.id;

        if (payload.status === 'OK' && payload.payload) {
            try {
                const { error: updateErr } = await supabase
                    .from('conversations')
                    .update({
                        state: 'TRANSCRIPTION_READY',
                        transcription_text: payload.payload.text,
                        transcription_chunks: payload.payload.chunks || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversationId)

                if (updateErr) {
                    console.error('Failed to update conversation', {
                        conversationId,
                        error: updateErr,
                    })
                    throw updateErr
                }

                console.info('Transcription completed successfully', {
                    conversationId,
                    textLength: payload.payload.text.length,
                    chunksCount: payload.payload.chunks?.length || 0,
                })

                return new Response(
                    JSON.stringify({
                        success: true,
                        conversation_id: conversationId,
                        text_length: payload.payload.text.length,
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } },
                )
            } catch (error) {
                console.error('Error processing completed transcription', {
                    conversationId,
                    error: String(error),
                })
                return new Response(JSON.stringify({ error: 'Internal error processing transcription' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            }
        } else {
            // Handle any non-OK status (failures, errors, etc.)
            try {
                const { error: updateErr } = await supabase
                    .from('conversations')
                    .update({
                        state: 'ERROR',
                        error_message: payload.error || `Transcription failed with status: ${payload.status}`,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversationId)

                if (updateErr) {
                    console.error('Failed to update conversation status to ERROR', {
                        conversationId,
                        error: updateErr,
                    })
                    throw updateErr
                }

                console.error('Received webhook from fal.ai with status', {
                    conversationId,
                    status: payload.status,
                    error: payload.error,
                })

                return new Response(
                    JSON.stringify({
                        success: false,
                        conversation_id: conversationId,
                        error: payload.error || `Status: ${payload.status}`,
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } },
                )
            } catch (error) {
                console.error('Error processing failed transcription', {
                    conversationId,
                    error: String(error),
                })
                return new Response(JSON.stringify({ error: 'Internal error processing failure' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            }
        }
    } catch (err) {
        console.error('Error in transcription-webhook', { error: String(err) })
        // Always return 200 for webhooks to prevent retries
        return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
