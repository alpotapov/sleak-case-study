'use client'

import React from 'react'
import Link from 'next/link'
import { ConversationDTO } from '@/lib/data-access/conversations'

const STATUS_LABELS = {
    UPLOADING: { label: 'Uploading...', color: 'text-blue-600' },
    TRANSCRIBING: { label: 'Transcribing audio...', color: 'text-yellow-600' },
    GENERATING_FEEDBACK: { label: 'Generating feedback...', color: 'text-purple-600' },
    COMPLETED: { label: 'Ready', color: 'text-green-600' },
    ERROR: { label: 'Error', color: 'text-red-600' },
}

export function ConversationList({ conversations }: { conversations: ConversationDTO[] }) {
    return (
        <div className="space-y-2">
            {conversations.length === 0 ? (
                <p className="text-muted-foreground">No conversations yet. Upload your first recording above!</p>
            ) : (
                conversations.map((conv) => (
                    <Link
                        key={conv.id}
                        href={`/conversations/analyze/${conv.id}`}
                        className="hover:bg-accent block rounded-lg border p-4 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium">{conv.title}</h3>
                                {conv.duration_seconds && (
                                    <p className="text-muted-foreground text-sm">
                                        Duration: {Math.floor(conv.duration_seconds / 60)}:
                                        {(conv.duration_seconds % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                            </div>
                            <div className={`text-sm font-medium ${STATUS_LABELS[conv.status].color}`}>
                                {STATUS_LABELS[conv.status].label}
                            </div>
                        </div>
                    </Link>
                ))
            )}
        </div>
    )
}
