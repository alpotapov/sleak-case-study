import 'server-only'
import { cache } from 'react'
import { createClient } from '../supabase/server'
import { getCurrentUser } from './auth'

enum ConversationState {
    UPLOADING = 0,
    FILE_READY = 1,
    TRANSCRIPTION_QUEUED = 2,
    TRANSCRIBING = 3,
    TRANSCRIPTION_READY = 4,
    FEEDBACK_GENERATION_QUEUED = 5,
    FEEDBACK_GENERATING = 6,
    COMPLETED = 7,
    ERROR = 8,
}

type StateLabel = {
    label: string
    color: string
}

const getStateLabel = (state: ConversationState) => {
    if (state === 0) return { label: 'Uploading...', color: 'text-blue-600' }
    if (state > 0 && state < 4) return { label: 'Transcribing audio...', color: 'text-yellow-600' }
    if (state >= 4 && state < 6) return { label: 'Generating feedback...', color: 'text-purple-600' }
    if (state === 7) return { label: 'Completed', color: 'text-green-600' }
    if (state === 8) return { label: 'Error', color: 'text-red-600' }
    return { label: 'Unknown', color: 'text-gray-600' }
}

export type ConversationDTO = {
    id: string
    title: string
    duration_seconds: number | null
    recording_url: string | null
    state: StateLabel
    transcription_text?: string | null
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
        state: getStateLabel(ConversationState[conversation.state as keyof typeof ConversationState]),
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
        state: getStateLabel(ConversationState[data.state as keyof typeof ConversationState]),
        transcription_text: data.transcription_text,
        feedback: data.feedback,
    }
})
