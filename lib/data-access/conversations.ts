import { cache } from 'react'
import 'server-only'
import { createClient } from '../supabase/server'
import { getCurrentUser } from './auth'

export type ConversationDTO = {
    id: string
    title: string
    duration_seconds: number | null
    recording_url: string | null
    state: 'UPLOADING' | 'TRANSCRIBING' | 'GENERATING_FEEDBACK' | 'COMPLETED' | 'ERROR'
}

export const getOwnConversations = cache(async (): Promise<ConversationDTO[]> => {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized: User must be authenticated')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching conversations:', error)
        throw new Error('Failed to fetch conversations')
    }

    const conversations: ConversationDTO[] = data.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        duration_seconds: conversation.duration_seconds,
        recording_url: conversation.recording_url,
        state: conversation.state,
    }))

    return conversations || []
})
