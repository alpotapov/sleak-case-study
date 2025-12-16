'use client'

import * as React from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithMagicLink } from '../actions'

export function LoginForm() {
    const [email, setEmail] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        const errorMessage = await signInWithMagicLink(email)

        setIsLoading(false)

        if (errorMessage) {
            setError(errorMessage)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="bg-muted rounded-lg border p-6 text-center">
                <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-full p-3">
                    <Mail className="h-6 w-6" />
                </div>
                <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                    We sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">Click the link in the email to sign in.</p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                        setSuccess(false)
                        setEmail('')
                    }}
                >
                    Try a different email
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                    Email address
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    autoFocus
                />
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-3 text-sm">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <span className="mr-2">Sending...</span>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                ) : (
                    <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send magic link
                    </>
                )}
            </Button>
        </form>
    )
}

