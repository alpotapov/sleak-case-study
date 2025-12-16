'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data-access/auth'

export async function createUploadUrl(fileName: string, fileType: string) {    
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    
    const supabase = await createClient()
    
    const conversationId = crypto.randomUUID()
    const storagePath = `${user.id}/${conversationId}/${fileName}`
    
    const { error: insertError } = await supabase.from('conversations').insert({
        id: conversationId,
        created_by: user.id,
        title: fileName,
        state: 'UPLOADING',
        recording_url: storagePath
    })
    
    if (insertError) throw insertError
    
    const { data, error } = await supabase.storage
        .from('conversations')
        .createSignedUploadUrl(storagePath)
    
    if (error) throw error
    
    return { uploadUrl: data.signedUrl, conversationId, storagePath }
}

export async function confirmUpload(conversationId: string, storagePath: string) {    
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    
    const supabase = await createClient()
    
    const { data, error: updateError } = await supabase
        .from('conversations')
        .update({ state: 'TRANSCRIBING' })
        .eq('id', conversationId)
        .eq('created_by', user.id)
        .select()
    
    if (updateError) throw updateError
    
    if (!data || data.length === 0) {
        throw new Error('Conversation not found or update failed')
    }

    console.log('Updated conversation:', data[0])
    
    await supabase.functions.invoke('transcribe-audio', {
        body: { conversationId, storagePath }
    })
    
    return { success: true }
}
