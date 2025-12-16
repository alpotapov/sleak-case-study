import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getConversationById } from '@/lib/data-access/conversations'
import { Button } from '@/components/ui/button'

const STATE_LABELS = {
    UPLOADING: { label: 'Uploading...', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    TRANSCRIBING: { label: 'Transcribing audio...', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    GENERATING_FEEDBACK: { label: 'Generating feedback...', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    COMPLETED: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-50' },
    ERROR: { label: 'Error', color: 'text-red-600', bgColor: 'bg-red-50' },
}

const TRANSCRIPTION_INFO = {
    UPLOADING: {
        label: 'Transcription will be available after upload completes...',
    },
    TRANSCRIBING: { label: 'Transcribing audio, please wait...' },
    ERROR: { label: 'Transcription failed due to an error' },
}

const FEEDBACK_INFO = {
    UPLOADING: {
        label: 'Feedback will be generated after transcription completes...',
    },
    TRANSCRIBING: {
        label: 'Feedback will be generated after transcription completes...',
    },
    GENERATING_FEEDBACK: {
        label: 'Generating feedback, please wait...',
    },
    ERROR: { label: 'Feedback generation failed due to an error' },
}

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let conversation
    try {
        conversation = await getConversationById(id)
    } catch (error) {
        console.error('Error loading conversation:', error)
        notFound()
    }

    const stateInfo = STATE_LABELS[conversation.state]

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
                        <div
                            className={`rounded-full px-4 py-2 text-sm font-medium ${stateInfo.bgColor} ${stateInfo.color}`}
                        >
                            {stateInfo.label}
                        </div>
                    </div>
                </div>

                {/* Transcription Section */}
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">Transcription</h2>
                    {conversation.transcription ? (
                        <div className="prose max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{conversation.transcription}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">
                            {conversation.state !== 'COMPLETED' && conversation.state !== 'GENERATING_FEEDBACK'
                                ? TRANSCRIPTION_INFO[conversation.state].label
                                : ''}
                        </p>
                    )}
                </div>

                {/* Feedback Section */}
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">Feedback</h2>
                    {conversation.feedback ? (
                        <div className="prose max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{conversation.feedback}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">
                            {conversation.state !== 'COMPLETED' ? FEEDBACK_INFO[conversation.state].label : ''}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
