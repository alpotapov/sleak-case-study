import { cache } from 'react'
import 'server-only'
import { createClient } from '../supabase/server'

export type UserProfile = {
    id: string
    email: string | undefined
    name: string | null
    avatar: string | null
    created_at: string | null
}

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar, created_at')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return {
            id: user.id,
            email: user.email,
            name: null,
            avatar: null,
            created_at: null,
        }
    }

    return {
        id: user.id,
        email: user.email,
        name: profile.name,
        avatar: profile.avatar,
        created_at: profile.created_at,
    }
})

export const requireAuth = cache(async (): Promise<UserProfile> => {
    const user = await getCurrentUser()
    
    if (!user) {
        throw new Error('Unauthorized: Authentication required')
    }
    
    return user
})