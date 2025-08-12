
import React, { useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { createClient } from "@supabase/supabase-js"
import { AuthContext } from "./AuthContext"

// Service role client for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  "https://ufcarzzouvxgqljqxdnc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY2FyenpvdXZ4Z3FsanF4ZG5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3NTk1MywiZXhwIjoyMDY5MTUxOTUzfQ.YNHS53Baa6Y517X0v1n15bKsILEWnMb85rpsmsaDy8M"
)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("🔐 Iniciando login híbrido...")
      console.log("📧 Email:", email)

      // Step 1: Check if user exists in dados_cliente (using admin client to bypass RLS)
      console.log("🔍 Buscando usuário na tabela dados_cliente...")

      const { data: clienteData, error: clienteError } = await supabaseAdmin
        .from("dados_cliente")
        .select("*")
        .eq("email", email)
        .eq("senha", password)
        .single()

      console.log("📊 Resultado dados_cliente:", { clienteData, clienteError })

      if (clienteError || !clienteData) {
        console.log("❌ Usuário não encontrado em dados_cliente")
        setIsLoading(false)
        return {
          error: "Credenciais inválidas. Verifique email e senha.",
          success: false,
        }
      }

      console.log("✅ Usuário encontrado em dados_cliente:", clienteData.nome)

      // Step 2: User found in dados_cliente - create custom auth session
      console.log("🎯 Criando sessão de autenticação personalizada...")

      // Create a mock user session (simulated authentication)
      const mockUser = {
        id: clienteData.id, // Use dados_cliente ID as user ID
        email: clienteData.email,
        user_metadata: {
          name: clienteData.nome,
          phone: clienteData.telefone,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        role: "authenticated",
      }

      // Create a mock session
      const mockSession = {
        access_token: `mock_token_${clienteData.id}`,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `refresh_${clienteData.id}`,
        user: mockUser,
      }

      console.log("✅ Sessão personalizada criada para:", clienteData.nome)

      // Set the session manually
      setSession(mockSession as any)
      setUser(mockUser as any)

      console.log("🎉 Login híbrido concluído com sucesso!")
      setIsLoading(false)
      return {
        error: null,
        success: true,
      }
    } catch (error) {
      console.error("❌ Erro inesperado:", error)
      setIsLoading(false)
      return {
        error: "Erro inesperado ao fazer login",
        success: false,
      }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || "",
          },
        },
      })
      setIsLoading(false)
      return {
        error: error?.message || null,
        success: !error,
      }
    } catch (error) {
      setIsLoading(false)
      return {
        error: "Erro inesperado ao criar conta",
        success: false,
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error?.message }
    } catch (error) {
      return { error: "Erro inesperado ao redefinir senha" }
    }
  }

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
