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
    transcription?: string | null
    feedback?: string | null
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
        transcription: conversation.transcription,
        feedback: conversation.feedback,
    }))

    return conversations || []
})

export const getConversationById = cache(async (id: string): Promise<ConversationDTO> => {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized: User must be authenticated')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single()

    if (error) {
        console.error('Error fetching conversation:', error)
        throw new Error('Failed to fetch conversation')
    }

    if (!data) {
        throw new Error('Conversation not found')
    }

    return {
        id: data.id,
        title: data.title,
        duration_seconds: data.duration_seconds,
        recording_url: data.recording_url,
        state: data.state,
        transcription: data.transcription,
        feedback: data.feedback,
    }
})
