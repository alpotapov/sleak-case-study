import { notFound } from 'next/navigation'
import { getConversationById } from '@/lib/data-access/conversations'
import ConversationDetail from './ConversationDetail'

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let initialConversation
    try {
        initialConversation = await getConversationById(id)
    } catch (error) {
        console.error('Error loading conversation:', error)
        notFound()
    }

    return <ConversationDetail initialConversation={initialConversation} conversationId={id} />
}