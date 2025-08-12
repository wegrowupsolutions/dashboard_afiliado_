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

// Chaves para persistência da sessão
const STORAGE_KEY = "afiliado_ai_session"
const USER_KEY = "afiliado_ai_user"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔄 Inicializando autenticação...")

        // 1. Tentar recuperar sessão do localStorage
        const savedSession = localStorage.getItem(STORAGE_KEY)
        const savedUser = localStorage.getItem(USER_KEY)

        if (savedSession && savedUser) {
          console.log("🔍 Sessão encontrada no localStorage")
          try {
            const parsedSession = JSON.parse(savedSession)
            const parsedUser = JSON.parse(savedUser)

            // Verificar se a sessão não expirou
            const now = Math.floor(Date.now() / 1000)
            if (parsedSession.expires_at > now) {
              console.log("✅ Sessão válida - restaurando usuário")
              setSession(parsedSession)
              setUser(parsedUser)
              setIsLoading(false)
              return
            } else {
              console.log("⏰ Sessão expirada - removendo do localStorage")
              localStorage.removeItem(STORAGE_KEY)
              localStorage.removeItem(USER_KEY)
            }
          } catch (parseError) {
            console.error("❌ Erro ao fazer parse da sessão:", parseError)
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(USER_KEY)
          }
        } else {
          console.log("📭 Nenhuma sessão salva encontrada")

          // 2. Fallback: verificar sessão do Supabase (apenas se não restaurou do localStorage)
          console.log("🔍 Verificando sessão do Supabase...")
          const {
            data: { session },
          } = await supabase.auth.getSession()
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("❌ Erro ao inicializar autenticação:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes (apenas para sessões reais do Supabase)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Só sobrescrever se for uma sessão real do Supabase
      // (não interferir com nossa sessão mock do localStorage)
      if (
        session?.access_token &&
        !session.access_token.startsWith("mock_token_")
      ) {
        console.log("🔄 Sessão real do Supabase detectada")
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      } else if (!session) {
        // Só limpar se não temos sessão salva no localStorage
        const savedSession = localStorage.getItem(STORAGE_KEY)
        if (!savedSession) {
          console.log("🧹 Limpando sessão (sem localStorage)")
          setSession(null)
          setUser(null)
          setIsLoading(false)
        }
      }
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
        id: clienteData.id, // UUID do registro
        cliente_id: clienteData.cliente_id, // UUID para relacionamentos
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

      // 💾 SALVAR NO LOCALSTORAGE PARA PERSISTIR APÓS REFRESH
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSession))
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
      console.log("💾 Sessão salva no localStorage para persistência")

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
    console.log("🔓 Iniciando logout...")

    try {
      // Clear mock session
      setSession(null)
      setUser(null)

      // 🗑️ LIMPAR LOCALSTORAGE
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(USER_KEY)
      console.log("🗑️ LocalStorage limpo")

      // Clear any Supabase session (if exists)
      await supabase.auth.signOut()

      console.log("✅ Logout concluído com sucesso!")

      // Redirect to login page
      window.location.href = "/"
    } catch (error) {
      console.error("❌ Erro durante logout:", error)
      // Force redirect even if error
      window.location.href = "/"
    }
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
