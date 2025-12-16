import { SiteHeader } from '@/components/site-header'
// import { UploadAudioWidget } from '@/components/upload-audio-widget'
import { getOwnConversations } from '@/lib/data-access/conversations'
import { ConversationList } from '@/app/conversations/_components/ConversationList'

export default async function Home() {
    const conversations = await getOwnConversations()
    
    return (
        <>
            <SiteHeader breadcrumbs={[{ title: 'Home', link: '/' }]} />
            <main className="@container/main flex flex-1 flex-col gap-2">
                <div className="px-4 py-4 md:py-6 lg:px-6">
                    {/* Upload Widget */}
                    {/* <UploadAudioWidget /> */}
                    
                    {/* Active Workflows List */}
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold mb-4">Your Conversations</h2>
                        <ConversationList conversations={conversations} />
                    </div>
                </div>
            </main>
        </>
    )
}