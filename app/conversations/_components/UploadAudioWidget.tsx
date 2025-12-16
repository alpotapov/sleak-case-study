'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUploadUrl, confirmUpload } from '@/app/conversations/actions'
import { useRouter } from 'next/navigation'

export function UploadAudioWidget() {
    const [file, setFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState<string>('')
    const router = useRouter()
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
        }
    }
    
    const handleUpload = async () => {
        if (!file) return
        
        setIsUploading(true)
        setUploadProgress('Preparing upload...')
        
        try {
            // Stage 1: Get signed upload URL from server
            const { uploadUrl, conversationId, storagePath } = await createUploadUrl(
                file.name,
                file.type
            )
            
            setUploadProgress('Uploading file...')
            
            // Stage 2: Upload file directly to Supabase Storage using signed URL
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })
            
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to storage')
            }
            
            setUploadProgress('Processing...')
            
            // Stage 3: Confirm upload and trigger transcription
            await confirmUpload(conversationId, storagePath)
            
            setUploadProgress('Upload complete! Starting transcription...')
            
            // Reset and refresh
            setFile(null)
            setUploadProgress('')
            router.refresh()
            
            // Optional: Navigate to the conversation detail page
            // router.push(`/conversations/analyze/${conversationId}`)
        } catch (error) {
            console.error('Upload failed:', error)
            setUploadProgress('')
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }
    
    return (
        <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4">Upload Audio Recording</h3>
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <Input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>
                <Button 
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                >
                    {isUploading ? 'Uploading...' : 'Start Analysis'}
                </Button>
            </div>
            {file && !isUploading && (
                <p className="text-sm text-muted-foreground mt-2">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
            )}
            {uploadProgress && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                    {uploadProgress}
                </p>
            )}
        </div>
    )
}