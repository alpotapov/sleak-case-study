import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { fal } from 'npm:@fal-ai/client@1.0.0'
import { createClient } from 'npm:@supabase/supabase-js@2.32.0'

interface QueueMessage {
    msg_id: string
    read_ct: number
    enqueued_at: string
    vt: string
    message: {
        conversation_id: string
        recording_url: string
        created_by: string
    }
}

console.info('transcription-worker started')

Deno.serve(async (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const falApiKey = Deno.env.get('FAL_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
    })

    // Configure fal.ai client
    fal.config({
        credentials: falApiKey,
    })

    try {
        // 1) Read messages from the transcription queue
        const { data: messages, error: readErr } = await supabase.schema('pgmq').rpc('read', {
            queue_name: 'transcription_queue',
            vt: 300, // visibility timeout in seconds
            qty: 1, // process one message at a time
        })

        if (readErr) throw readErr

        if (!messages || messages.length === 0) {
            return new Response(JSON.stringify({ processed: 0, message: 'No messages in queue' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const processed: string[] = []
        const failed: Array<{ id: string; error: string }> = []

        for (const msg of messages as QueueMessage[]) {
            const { conversation_id, recording_url, created_by } = msg.message

            try {
                if (!recording_url) {
                    throw new Error('No recording_url provided')
                }

                // 2) Submit transcription job to fal.ai
                const webhookUrl = `${supabaseUrl}/functions/v1/transcription-webhook`
                const { data: audioUrl, error: audioUrlErr } = await supabase.storage
                    .from('conversations')
                    .createSignedUrl(recording_url, 300)
                if (audioUrlErr) throw audioUrlErr

                const { request_id } = await fal.queue.submit('fal-ai/whisper', {
                    input: {
                        audio_url: audioUrl.signedUrl,
                    },
                    webhookUrl: `${webhookUrl}?conversation_id=${conversation_id}`,
                })

                console.info(`Submitted transcription for conversation ${conversation_id}, request_id: ${request_id}`)

                // Update conversation state to TRANSCRIBING
                const { error: updateErr } = await supabase
                    .from('conversations')
                    .update({
                        state: 'TRANSCRIBING',
                        transcription_fal_request_id: request_id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversation_id)

                if (updateErr) {
                    console.error('Failed to update conversation state to TRANSCRIBING', {
                        conversationId: conversation_id,
                        error: updateErr,
                    })
                    throw updateErr
                }

                // 3) Delete message from queue (acknowledge)
                const { error: delErr } = await supabase.schema('pgmq_public').rpc('delete', {
                    queue_name: 'transcription_queue',
                    message_id: msg.msg_id,
                })

                if (delErr) {
                    console.error(`Failed to delete message ${msg.msg_id}`, delErr)
                    throw delErr
                }

                processed.push(conversation_id)
            } catch (err) {
                console.error(`Failed to process conversation ${conversation_id}`, err)

                failed.push({ id: conversation_id, error: String(err) })
            }
        }

        return new Response(
            JSON.stringify({
                processed: processed.length,
                failed: failed.length,
                conversation_ids: processed,
                failures: failed,
            }),
            { headers: { 'Content-Type': 'application/json' } },
        )
    } catch (err) {
        console.error('Error in transcription-worker', err)
        return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
