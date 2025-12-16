'use client'

import React from 'react'
import Link from 'next/link'
import type { ConversationDTO } from '@/lib/data-access/conversations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type ConversationDetailProps = {
    initialConversation: ConversationDTO
    conversationId: string
}

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

export default function ConversationDetail({ initialConversation, conversationId }: ConversationDetailProps) {
    const [conversation, setConversation] = React.useState<ConversationDTO>(initialConversation)

    const [state, setState] = React.useState<StateLabel>(initialConversation.state)
    const [transcriptionText, setTranscriptionText] = React.useState<string | null | undefined>(initialConversation.transcription_text)
    const [feedback, setFeedback] = React.useState<string | null | undefined>(initialConversation.feedback)

    React.useEffect(() => {
        const supabase = createClient()
        supabase.realtime.setAuth().then(() => {
            const changes = supabase
                .channel(`conversation:${conversationId}`, {
                    config: { private: true },
                })
                .on('broadcast', { event: 'INSERT' }, (payload) => {console.log(payload)})
                .on('broadcast', { event: 'UPDATE' }, (payload) => {
                  console.log(payload);
                  setState(getStateLabel(ConversationState[payload.payload.state as keyof typeof ConversationState]))
                  setTranscriptionText(payload.payload.transcription_text)
                  setFeedback(payload.payload.feedback)
                })
                .on('broadcast', { event: 'DELETE' }, (payload) => console.log(payload))
                .subscribe()

            return () => {
                supabase.removeChannel(changes)
            }
        })
    }, [conversationId])

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="outline" size="sm">
                        ← Back to Conversations
                    </Button>
                </Link>
            </div>

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-card rounded-lg border p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{conversation.title}</h1>
                            {conversation.duration_seconds && (
                                <p className="text-muted-foreground mt-2">
                                    Duration: {Math.floor(conversation.duration_seconds / 60)}:
                                    {(conversation.duration_seconds % 60).toString().padStart(2, '0')}
                                </p>
                            )}
                        </div>
                        <div className={`rounded-full px-4 py-2 text-sm font-medium ${state.color}`}>
                            {state.label}
                        </div>
                    </div>
                </div>

                {/* Transcription Section */}
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">Transcription</h2>
                    {transcriptionText ? (
                        <div className="prose max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{transcriptionText}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">Transcription will be available shortly...</p>
                    )}
                </div>

                {/* Feedback Section */}
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">Feedback</h2>
                    {feedback ? (
                        <div className="prose max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{feedback}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">Feedback will be available shortly...</p>
                    )}
                </div>
            </div>
        </div>
    )
}
