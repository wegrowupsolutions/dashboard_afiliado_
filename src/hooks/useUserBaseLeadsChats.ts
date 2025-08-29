import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export interface ChatConversation {
  id: string
  remotejid: string
  nome: string
  timestamp: string
  lastMessage: string
  unreadCount: number
  isPaused: boolean
  pauseReason?: string
  pauseExpiresAt?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  remotejid: string
  nome: string
  message: string
  timestamp: string
  isFromUser: boolean
  conversationId: string
}

export function useUserBaseLeadsChats() {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Obter nome da tabela base_leads do usuário
  const getUserBaseLeadsTable = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null

    try {
      // Buscar na tabela dados_cliente (onde agora estão todas as informações)
      const { data, error } = await supabase
        .from("dados_cliente")
        .select("base_leads")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Erro ao buscar base_leads:", error)
        return null
      }

      return data?.base_leads || null
    } catch (error) {
      console.error("Erro inesperado ao buscar base_leads:", error)
      return null
    }
  }, [user?.id])

  // Buscar conversas do usuário
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setConversations([])
        setLoading(false)
        return
      }

      const tableName = await getUserBaseLeadsTable()
      if (!tableName) {
        console.log("⚠️ Tabela base_leads não configurada")
        setConversations([])
        setLoading(false)
        return
      }

      console.log(`�� Buscando conversas na tabela: ${tableName}`)

      // Buscar conversas da tabela base_leads do usuário
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("updated_at", { ascending: false })

      if (error) {
        console.error(`❌ Erro ao buscar conversas em ${tableName}:`, error)
        setError("Erro ao carregar conversas")
        setConversations([])
        return
      }

      // Converter para formato de conversas
      const formattedConversations: ChatConversation[] = (data || []).map((lead) => ({
        id: lead.remotejid, // Usar remotejid como ID único
        remotejid: lead.remotejid,
        nome: lead.nome || "Cliente",
        timestamp: lead.timestamp,
        lastMessage: "Nova conversa iniciada",
        unreadCount: 0,
        isPaused: false, // Por padrão, conversa não está pausada
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      }))

      console.log(`✅ ${formattedConversations.length} conversas encontradas`)
      setConversations(formattedConversations)
      setError(null)

    } catch (error) {
      console.error("❌ Erro inesperado ao buscar conversas:", error)
      setError("Erro inesperado ao carregar conversas")
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, getUserBaseLeadsTable])

  // Pausar conversa
  const pauseConversation = async (remotejid: string, reason: string, duration?: number) => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        })
        return false
      }

      const tableName = await getUserBaseLeadsTable()
      if (!tableName) {
        toast({
          title: "Erro",
          description: "Tabela de conversas não configurada",
          variant: "destructive",
        })
        return false
      }

      // Calcular data de expiração se houver duração
      const pauseExpiresAt = duration 
        ? new Date(Date.now() + duration * 1000).toISOString()
        : null

      // Atualizar conversa na tabela base_leads
      const { error } = await supabase
        .from(tableName)
        .update({
          is_paused: true,
          pause_reason: reason,
          pause_expires_at: pauseExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("remotejid", remotejid)

      if (error) {
        console.error("❌ Erro ao pausar conversa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível pausar a conversa",
          variant: "destructive",
        })
        return false
      }

      // Atualizar estado local
      setConversations(prev => prev.map(conv => 
        conv.remotejid === remotejid 
          ? { 
              ...conv, 
              isPaused: true, 
              pauseReason: reason,
              pauseExpiresAt: pauseExpiresAt || undefined
            }
          : conv
      ))

      // Enviar webhook para pausar bot
      try {
        const response = await fetch(
          "https://webhook.serverwegrowup.com.br/webhook/pausa_bot",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: remotejid,
              duration: duration || null,
              reason: reason,
              unit: "seconds",
            }),
          }
        )

        if (response.ok) {
          toast({
            title: "✅ Conversa pausada",
            description: duration 
              ? `Bot pausado por ${duration} segundos`
              : "Bot pausado indefinidamente",
          })
        } else {
          console.warn("⚠️ Webhook de pausa retornou erro, mas conversa foi pausada localmente")
        }
      } catch (webhookError) {
        console.warn("⚠️ Erro no webhook de pausa, mas conversa foi pausada localmente:", webhookError)
      }

      return true

    } catch (error) {
      console.error("❌ Erro ao pausar conversa:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao pausar a conversa",
        variant: "destructive",
      })
      return false
    }
  }

  // Continuar conversa
  const resumeConversation = async (remotejid: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        })
        return false
      }

      const tableName = await getUserBaseLeadsTable()
      if (!tableName) {
        toast({
          title: "Erro",
          description: "Tabela de conversas não configurada",
          variant: "destructive",
        })
        return false
      }

      // Atualizar conversa na tabela base_leads
      const { error } = await supabase
        .from(tableName)
        .update({
          is_paused: false,
          pause_reason: null,
          pause_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("remotejid", remotejid)

      if (error) {
        console.error("❌ Erro ao continuar conversa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível continuar a conversa",
          variant: "destructive",
        })
        return false
      }

      // Atualizar estado local
      setConversations(prev => prev.map(conv => 
        conv.remotejid === remotejid 
          ? { 
              ...conv, 
              isPaused: false, 
              pauseReason: undefined,
              pauseExpiresAt: undefined
            }
          : conv
      ))

      // Enviar webhook para continuar bot
      try {
        const response = await fetch(
          "https://webhook.serverwegrowup.com.br/webhook/inicia_bot",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: remotejid,
            }),
          }
        )

        if (response.ok) {
          toast({
            title: "✅ Conversa retomada",
            description: "Bot ativado novamente para esta conversa",
          })
        } else {
          console.warn("⚠️ Webhook de continuação retornou erro, mas conversa foi retomada localmente")
        }
      } catch (webhookError) {
        console.warn("⚠️ Erro no webhook de continuação, mas conversa foi retomada localmente:", webhookError)
      }

      return true

    } catch (error) {
      console.error("❌ Erro ao continuar conversa:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao continuar a conversa",
        variant: "destructive",
      })
      return false
    }
  }

  // Verificar conversas pausadas que expiraram
  const checkExpiredPauses = useCallback(async () => {
    try {
      const tableName = await getUserBaseLeadsTable()
      if (!tableName) return

      const now = new Date().toISOString()
      
      // Buscar conversas pausadas que expiraram
      const { data: expiredConversations, error } = await supabase
        .from(tableName)
        .select("remotejid")
        .eq("is_paused", true)
        .not("pause_expires_at", "is", null)
        .lt("pause_expires_at", now)

      if (error) {
        console.error("❌ Erro ao verificar pausas expiradas:", error)
        return
      }

      if (expiredConversations && expiredConversations.length > 0) {
        console.log(`🔄 ${expiredConversations.length} conversas pausadas expiraram, retomando...`)
        
        // Retomar todas as conversas expiradas
        for (const conv of expiredConversations) {
          await resumeConversation(conv.remotejid)
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar pausas expiradas:", error)
    }
  }, [getUserBaseLeadsTable, resumeConversation])

  // Configurar verificação periódica de pausas expiradas
  useEffect(() => {
    const interval = setInterval(checkExpiredPauses, 30000) // Verificar a cada 30 segundos
    return () => clearInterval(interval)
  }, [checkExpiredPauses])

  // Configurar real-time para atualizações
  useEffect(() => {
    if (!user?.id) return

    const tableName = getUserBaseLeadsTable()
    if (!tableName) return

    // Inscrever para mudanças na tabela base_leads do usuário
    const channel = supabase
      .channel(`user_base_leads_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log('🔄 Mudança detectada na tabela base_leads:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Nova conversa
            const newLead = payload.new
            const newConversation: ChatConversation = {
              id: newLead.remotejid,
              remotejid: newLead.remotejid,
              nome: newLead.nome || "Cliente",
              timestamp: newLead.timestamp,
              lastMessage: "Nova conversa iniciada",
              unreadCount: 1,
              isPaused: false,
              created_at: newLead.created_at,
              updated_at: newLead.updated_at,
            }
            
            setConversations(prev => [newConversation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Conversa atualizada
            const updatedLead = payload.new
            setConversations(prev => prev.map(conv => 
              conv.remotejid === updatedLead.remotejid
                ? {
                    ...conv,
                    nome: updatedLead.nome || conv.nome,
                    timestamp: updatedLead.timestamp,
                    isPaused: updatedLead.is_paused || false,
                    pauseReason: updatedLead.pause_reason,
                    pauseExpiresAt: updatedLead.pause_expires_at,
                    updated_at: updatedLead.updated_at,
                  }
                : conv
            ))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, getUserBaseLeadsTable])

  // Buscar conversas quando o componente montar
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    pauseConversation,
    resumeConversation,
    checkExpiredPauses,
  }
}
