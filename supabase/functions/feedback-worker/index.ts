import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { HumanMessage, SystemMessage } from 'npm:@langchain/core/messages'
import { AzureChatOpenAI } from 'npm:@langchain/openai'
import { createClient } from 'npm:@supabase/supabase-js@2.32.0'
import 'npm:dotenv/config'

interface QueueMessage {
    msg_id: string
    read_ct: number
    enqueued_at: string
    vt: string
    message: {
        conversation_id: string
    }
}

Deno.serve(async (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
    })

    const llm = new AzureChatOpenAI({
        azureOpenAIApiKey: Deno.env.get('AZURE_OPENAI_API_KEY'),
        azureOpenAIApiInstanceName: Deno.env.get('AZURE_OPENAI_API_INSTANCE_NAME'),
        azureOpenAIApiDeploymentName: Deno.env.get('AZURE_OPENAI_API_DEPLOYMENT_NAME'),
        azureOpenAIApiVersion: Deno.env.get('AZURE_OPENAI_API_VERSION'),

        temperature: 0.2,
    })

    // 1) Read messages from the transcription queue
    const { data: messages, error: readErr } = await supabase.schema('pgmq').rpc('read', {
        queue_name: 'feedback_queue',
        vt: 30, // visibility timeout in seconds
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
        const { conversation_id } = msg.message

        const { data: conversation, error: conversationSelectError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversation_id)
            .single()

        if (conversationSelectError) {
            console.error('Error while getting conversation', { conversation_id, error: conversationSelectError })
            return new Response(JSON.stringify({ error: 'Error while getting conversation' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        if (!conversation) {
            console.error('Conversation not found', { conversation_id })
            return new Response(JSON.stringify({ error: 'Conversation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const res = await llm.invoke([
            new SystemMessage(
                'You are sales coach. You are given a conversation and you need to provide feedback on what could have been said better.',
            ),
            new HumanMessage(`Provide feedback on the following conversation: ${conversation.transcription_text}`),
        ])

        const { error: updateErr } = await supabase
            .from('conversations')
            .update({
                feedback: res.content,
            })
            .eq('id', conversation_id)

        if (updateErr) {
            console.error('Error while updating conversation', { conversation_id, error: updateErr })
            return new Response(JSON.stringify({ error: 'Error while updating conversation' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        processed.push(conversation_id)
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
})
