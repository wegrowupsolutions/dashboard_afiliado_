import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Conversation, N8nChatHistory, Client } from "@/types/chat"
import { formatMessageTime } from "@/utils/chatUtils"

export function useUserFilteredConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const updateConversationLastMessage = async (sessionId: string) => {
    try {
      // Verificar se esta conversa pertence ao usuário atual
      if (!user?.cliente_id && !user?.id) return

      const userId = user.cliente_id || user.id

      // Buscar última mensagem apenas se o usuário tem acesso
      const { data: historyData, error: historyError } = await supabase
        .from("n8n_chat_histories")
        .select("*")
        .eq("session_id", sessionId)
        .order("id", { ascending: false })
        .limit(1)

      if (historyError) throw historyError

      if (historyData && historyData.length > 0) {
        const chatHistory = historyData[0] as N8nChatHistory

        setConversations((currentConversations) => {
          return currentConversations.map((conv) => {
            if (conv.id === sessionId) {
              let lastMessageContent = "Sem mensagem"
              if (chatHistory.message) {
                if (typeof chatHistory.message === "string") {
                  try {
                    const jsonMessage = JSON.parse(chatHistory.message)
                    if (jsonMessage.type && jsonMessage.content) {
                      lastMessageContent = jsonMessage.content
                    }
                  } catch (e) {
                    lastMessageContent = chatHistory.message
                  }
                } else if (typeof chatHistory.message === "object") {
                  if (chatHistory.message.content) {
                    lastMessageContent = chatHistory.message.content
                  } else if (
                    chatHistory.message.messages &&
                    Array.isArray(chatHistory.message.messages)
                  ) {
                    const lastMsg =
                      chatHistory.message.messages[
                        chatHistory.message.messages.length - 1
                      ]
                    lastMessageContent = lastMsg?.content || "Sem mensagem"
                  } else if (
                    chatHistory.message.type &&
                    chatHistory.message.content
                  ) {
                    lastMessageContent = chatHistory.message.content
                  }
                }
              }

              // Use hora field if available, otherwise fall back to data field
              const messageDate = chatHistory.hora
                ? new Date(chatHistory.hora)
                : chatHistory.data
                ? new Date(chatHistory.data)
                : new Date()

              return {
                ...conv,
                lastMessage: lastMessageContent || "Sem mensagem",
                time: formatMessageTime(messageDate),
                unread: conv.unread + 1,
              }
            }
            return conv
          })
        })
      }
    } catch (error) {
      console.error("Error updating conversation last message:", error)
    }
  }

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)

      if (!user?.cliente_id && !user?.id) {
        console.log("🔐 Usuário não logado - não carregando conversas")
        setConversations([])
        setLoading(false)
        return
      }

      const userId = user.cliente_id || user.id
      console.log(`🔍 Buscando conversas para usuário: ${userId}`)

      // RELAÇÃO 1:1 - 1 USUÁRIO : 1 EVO*
      console.log(`🔍 Verificando EVO* do usuário: ${userId}`)

      // PASSO 1: Buscar evo_instance do usuário para logs (opcional, pode remover se não precisar)
      const { data: configData } = await supabase
        .from("cliente_config")
        .select("evo_instance")
        .eq("cliente_id", userId)
        .single()

      const userEvoInstance = configData?.evo_instance || "não configurado"
      console.log(`📱 EVO* do usuário: ${userEvoInstance}`)

      // PASSO 2: Como é 1:1, TODOS os dados_cliente com sessionid pertencem a este usuário
      // Buscar todos os clientes que têm conversa ativa
      const { data: clientsData, error: clientsError } = await supabase
        .from("dados_cliente")
        .select("*")
        .not("sessionid", "is", null)
        .not("telefone", "is", null)

      if (clientsError || !clientsData || clientsData.length === 0) {
        console.log("⚠️ Nenhum cliente com conversa encontrado")
        setConversations([])
        setLoading(false)
        return
      }

      console.log(
        `👥 ${clientsData.length} clientes encontrados (1:1 - todos pertencem à EVO*: ${userEvoInstance})`
      )

      // PASSO 3: Verificar quais clientes têm histórico de chat
      const sessionIds = clientsData
        .map((client) => client.sessionid)
        .filter(Boolean)

      if (sessionIds.length === 0) {
        console.log("💬 Nenhum sessionid encontrado nos clientes")
        setConversations([])
        setLoading(false)
        return
      }

      const { data: chatHistoryData, error: chatHistoryError } = await supabase
        .from("n8n_chat_histories")
        .select("session_id")
        .in("session_id", sessionIds)
        .order("id", { ascending: false })

      if (chatHistoryError) throw chatHistoryError

      if (!chatHistoryData || chatHistoryData.length === 0) {
        console.log("💬 Nenhum histórico de chat encontrado para esta EVO*")
        setConversations([])
        setLoading(false)
        return
      }

      const uniqueSessionIds = Array.from(
        new Set(chatHistoryData.map((item) => item.session_id))
      )

      // Filtrar clientes que têm histórico de chat
      const clientsWithChat = clientsData.filter((client) =>
        uniqueSessionIds.includes(client.sessionid)
      )

      console.log(
        `💭 ${clientsWithChat.length} conversas ativas encontradas para EVO*: ${userEvoInstance}`
      )

      // PASSO 4: Criar conversas formatadas para esta EVO*
      const conversationsData: Conversation[] = clientsWithChat.map(
        (client: Client) => {
          return {
            id: client.sessionid,
            name: client.nome || "Cliente sem nome",
            lastMessage: "Carregando...",
            time: "Recente",
            unread: 0,
            avatar: "👤",
            phone: client.telefone,
            email: client.email || "Sem email",
            sessionId: client.sessionid,
          }
        }
      )

      // PASSO 5: Buscar última mensagem para cada conversa
      for (const conversation of conversationsData) {
        const { data: historyData, error: historyError } = await supabase
          .from("n8n_chat_histories")
          .select("*")
          .eq("session_id", conversation.sessionId)
          .order("id", { ascending: false })
          .limit(1)

        if (!historyError && historyData && historyData.length > 0) {
          const chatHistory = historyData[0] as N8nChatHistory

          let lastMessageContent = "Sem mensagem"
          if (chatHistory.message) {
            if (typeof chatHistory.message === "string") {
              try {
                const jsonMessage = JSON.parse(chatHistory.message)
                if (jsonMessage.type && jsonMessage.content) {
                  lastMessageContent = jsonMessage.content
                }
              } catch (e) {
                lastMessageContent = chatHistory.message
              }
            } else if (typeof chatHistory.message === "object") {
              if (chatHistory.message.content) {
                lastMessageContent = chatHistory.message.content
              } else if (
                chatHistory.message.messages &&
                Array.isArray(chatHistory.message.messages)
              ) {
                const lastMsg =
                  chatHistory.message.messages[
                    chatHistory.message.messages.length - 1
                  ]
                lastMessageContent = lastMsg?.content || "Sem mensagem"
              } else if (
                chatHistory.message.type &&
                chatHistory.message.content
              ) {
                lastMessageContent = chatHistory.message.content
              }
            }
          }

          conversation.lastMessage = lastMessageContent || "Sem mensagem"

          // Use hora field if available, otherwise fall back to data field
          const messageDate = chatHistory.hora
            ? new Date(chatHistory.hora)
            : chatHistory.data
            ? new Date(chatHistory.data)
            : new Date()

          conversation.time = formatMessageTime(messageDate)
        }
      }

      setConversations(conversationsData)
      console.log(
        `✅ ${conversationsData.length} conversas carregadas para usuário ${userId}`
      )
    } catch (error) {
      console.error("Error fetching user conversations:", error)
      toast({
        title: "Erro ao carregar conversas",
        description: "Ocorreu um erro ao carregar as conversas do usuário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Initial fetch when user changes
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    setConversations,
    loading,
    updateConversationLastMessage,
    fetchConversations,
  }
}
