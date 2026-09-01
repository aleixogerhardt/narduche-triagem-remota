import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

import type { Profile } from '../types/domain'

export type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)