import { createContext } from "react"
import { Session, User } from "@supabase/supabase-js"

export type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: string | null
    success: boolean
  }>
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{
    error: string | null
    success: boolean
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
