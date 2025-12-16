import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getConversationById } from '@/lib/data-access/conversations'
import { Button } from '@/components/ui/button'

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let conversation
    try {
        conversation = await getConversationById(id)
    } catch (error) {
        console.error('Error loading conversation:', error)
        notFound()
    }

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
                            className={`rounded-full px-4 py-2 text-sm font-medium ${conversation.state.color}`}
                        >
                            {conversation.state.label}
                        </div>
                    </div>
                </div>

                {/* Transcription Section */}
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">Transcription</h2>
                    {conversation.transcription_text ? (
                        <div className="prose max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{conversation.transcription_text}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">
                            Transcription will be available shortly...
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
                            Feedback will be available shortly...
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
