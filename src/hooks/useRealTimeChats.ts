import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export interface RealChatConversation {
  id: number
  remotejid: string
  nome: string
  timestamp: string
  afiliado_mensagem: string | null
  conversation_history: any
  created_at: string
  updated_at: string
  isPaused?: boolean
  pauseReason?: string
  pauseExpiresAt?: string
}

export interface ChatMessage {
  role: string
  parts: Array<{ text: string }>
  timestamp: string
  isFromClient: boolean
}

export interface GroupedConversation {
  remotejid: string
  nome: string
  messages: ChatMessage[]
  lastActivity: string
  unreadCount: number
  isPaused: boolean
}

export const useRealTimeChats = () => {
  const [conversations, setConversations] = useState<GroupedConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<GroupedConversation | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Função para obter o nome do usuário da tabela dados_cliente
  const getUserTableName = useCallback(async (email: string): Promise<string | null> => {
    try {
      console.log('🔍 Buscando nome do usuário para email:', email)
      
      // Buscar o nome do usuário na tabela dados_cliente
      const { data: userData, error } = await supabase
        .from('dados_cliente')
        .select('nome')
        .eq('email', email)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar usuário em dados_cliente:', error)
        return null
      }

      if (!userData || !userData.nome) {
        console.error('❌ Usuário não encontrado ou sem nome em dados_cliente')
        return null
      }

      const userName = userData.nome
      // CRÍTICO: Sempre converter para minúsculas para corresponder às tabelas do Supabase
      const normalizedName = userName
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '_') // Substitui espaços por underscores
      
      const tableName = `${normalizedName}_base_leads`
      
      console.log('✅ Nome do usuário encontrado:', userName)
      console.log(' Nome normalizado (minúsculas):', normalizedName)
      console.log('📋 Tabela a ser consultada:', tableName)
      
      return tableName
    } catch (error) {
      console.error('❌ Erro ao determinar tabela do usuário:', error)
      return null
    }
  }, [])

  // Função para escutar uma tabela específica (baseada no código do Supabase)
  const listenToLeadsTable = useCallback(async (username: string) => {
    const tableName = `${username}_base_leads`
    
    console.log('🔌 Configurando listener para tabela:', tableName)
    
    return supabase
      .channel(`${username}-leads-changes`)
      .on('postgres_changes', 
        { 
          event: '*',  // Escuta INSERT, UPDATE, DELETE
          schema: 'public', 
          table: tableName 
        }, 
        (payload) => {
          console.log(`🔄 Mudança na tabela ${tableName}:`, payload)
          
          // Aguardar um pouco para garantir que a mudança foi processada
          setTimeout(() => {
            console.log('🔄 Atualizando conversas após mudança detectada...')
            fetchConversations()
          }, 1000)
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal real-time:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal real-time conectado com sucesso para:', tableName)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no canal real-time para:', tableName)
        }
      })
  }, [])

  // Função para processar mensagens e agrupar por cliente
  const processConversations = useCallback((data: RealChatConversation[]) => {
    const grouped: { [key: string]: GroupedConversation } = {}

    data.forEach((row) => {
      const remotejid = row.remotejid
      const nome = row.nome || 'Cliente'
      
      if (!grouped[remotejid]) {
        grouped[remotejid] = {
          remotejid,
          nome,
          messages: [],
          lastActivity: row.timestamp,
          unreadCount: 0,
          isPaused: false
        }
      }

      // Adicionar mensagem do cliente (se existir)
      if (row.conversation_history && row.conversation_history.role === 'user') {
        const clientMessage: ChatMessage = {
          role: 'user',
          parts: row.conversation_history.parts,
          timestamp: row.timestamp,
          isFromClient: true
        }
        grouped[remotejid].messages.push(clientMessage)
      }

      // Adicionar mensagem do agente (se existir)
      if (row.afiliado_mensagem) {
        // Extrair o texto da mensagem do agente
        let agentText = row.afiliado_mensagem
        try {
          if (agentText.startsWith('{"parts":')) {
            const parsed = JSON.parse(agentText)
            agentText = parsed.parts?.[0]?.text || agentText
          }
        } catch (e) {
          // Usar texto original se não conseguir fazer parse
        }

        const agentMessage: ChatMessage = {
          role: 'assistant',
          parts: [{ text: agentText }],
          timestamp: row.timestamp,
          isFromClient: false
        }
        grouped[remotejid].messages.push(agentMessage)
      }

      // Atualizar última atividade
      if (new Date(row.timestamp) > new Date(grouped[remotejid].lastActivity)) {
        grouped[remotejid].lastActivity = row.timestamp
      }
    })

    // Ordenar mensagens por timestamp e converter para array
    const result = Object.values(grouped).map(conv => {
      // Ordenar mensagens por timestamp cronologicamente
      const sortedMessages = conv.messages.sort((a, b) => {
        try {
          const dateA = new Date(a.timestamp)
          const dateB = new Date(b.timestamp)
          
          // Verificar se as datas são válidas
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.warn('⚠️ Timestamp inválido encontrado:', { a: a.timestamp, b: b.timestamp })
            return 0 // Manter ordem original se timestamp for inválido
          }
          
          // Ordenar cronologicamente: mais antiga primeiro (como WhatsApp)
          return dateA.getTime() - dateB.getTime()
        } catch (error) {
          console.error('❌ Erro ao ordenar mensagens:', error)
          return 0
        }
      })

      console.log('🔄 Mensagens ordenadas para', conv.nome, ':', 
        sortedMessages.map(m => ({
          text: m.parts[0]?.text?.substring(0, 30) + '...',
          timestamp: m.timestamp,
          isFromClient: m.isFromClient,
          time: formatTimestamp(m.timestamp)
        }))
      )

      return {
        ...conv,
        messages: sortedMessages
      }
    })

    // Ordenar conversas por última atividade
    return result.sort((a, b) => {
      try {
        const dateA = new Date(a.lastActivity)
        const dateB = new Date(b.lastActivity)
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0
        }
        
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        return 0
      }
    })
  }, [])

  // Função para formatar timestamp corretamente (UTC para horário local)
  const formatTimestamp = (timestamp: string): string => {
    try {
      // Converter UTC para horário local (-03:00)
      const date = new Date(timestamp)
      
      if (isNaN(date.getTime())) {
        return 'Timestamp inválido'
      }
      
      // Formatar no fuso horário local (Brasília)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo' // Força fuso horário de Brasília
      })
    } catch (error) {
      console.error('❌ Erro ao formatar timestamp:', error)
      return 'Timestamp inválido'
    }
  }

  // Buscar conversas iniciais (da tabela específica do usuário)
  const fetchConversations = useCallback(async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const userEmail = user.email
      
      console.log(' Buscando conversas do usuário:', userEmail)
      
      // Primeiro, obter o nome do usuário para determinar a tabela
      const tableName = await getUserTableName(userEmail)
      
      if (!tableName) {
        console.error('❌ Não foi possível determinar a tabela do usuário')
        toast({
          title: "Erro",
          description: "Usuário não configurado corretamente. Entre em contato com o suporte.",
          variant: "destructive",
        })
        setConversations([])
        setLoading(false)
        return
      }

      console.log(' Consultando tabela:', tableName)
      
      // Buscar conversas da tabela específica do usuário
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar conversas na tabela', tableName, ':', error)
        toast({
          title: "Erro",
          description: `Não foi possível carregar as conversas da tabela ${tableName}.`,
          variant: "destructive",
        })
        return
      }

      console.log(' Dados recebidos:', data?.length || 0, 'registros da tabela', tableName)
      
      if (data && data.length > 0) {
        const processed = processConversations(data)
        console.log('🔄 Conversas processadas:', processed.length, 'conversas')
        setConversations(processed)
        
        // Selecionar primeira conversa se não houver nenhuma selecionada
        if (processed.length > 0 && !selectedConversation) {
          setSelectedConversation(processed[0])
        }
      } else {
        console.log('📭 Nenhuma conversa encontrada na tabela', tableName)
        setConversations([])
      }
    } catch (error) {
      console.error('❌ Erro ao buscar conversas:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.email, getUserTableName, processConversations, selectedConversation, toast])

  // Configurar real-time usando o código do Supabase
  useEffect(() => {
    if (!user?.email) return

    const setupRealtime = async () => {
      const userEmail = user.email
      const tableName = await getUserTableName(userEmail)
      
      if (!tableName) return
      
      // Extrair o nome do usuário da tabela para o listener
      const username = tableName.replace('_base_leads', '')
      
      console.log('🔌 Configurando real-time para usuário:', userEmail, 'na tabela:', tableName)
      
      // Usar a função do código do Supabase
      const subscription = await listenToLeadsTable(username)
      
      return () => {
        if (subscription) {
          console.log('🔌 Removendo subscription real-time para:', tableName)
          supabase.removeChannel(subscription)
        }
      }
    }

    setupRealtime()
  }, [user?.email, getUserTableName, listenToLeadsTable])

  // Buscar conversas na inicialização
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Função para pausar/despausar conversa no Evolution (controle real do agente)
  const togglePauseConversation = useCallback(async (remotejid: string) => {
    try {
      const userEmail = user?.email
      if (!userEmail) return
      
      const tableName = await getUserTableName(userEmail)
      if (!tableName) return
      
      // Buscar conversa atual
      const currentConversation = conversations.find(conv => conv.remotejid === remotejid)
      if (!currentConversation) return
      
      const newPauseStatus = !currentConversation.isPaused
      
      console.log(` ${newPauseStatus ? 'Pausando' : 'Retomando'} conversa no Evolution para:`, remotejid)
      
      // INTEGRAÇÃO REAL COM A API DO EVOLUTION
      if (newPauseStatus) {
        // PAUSAR AGENTE NO EVOLUTION - DELETE para logout da instância
        const pauseResponse = await fetch(`https://evolution.serverwegrowup.com.br/instance/logout/${tableName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_EVOLUTION_API_KEY || '066327121bd64f8356c26e9edfa1799d'
          }
        })
        
        if (pauseResponse.ok) {
          console.log('✅ Agente pausado no Evolution com sucesso')
        } else {
          console.error('❌ Erro ao pausar agente no Evolution:', pauseResponse.status)
          throw new Error('Falha ao pausar agente no Evolution')
        }
      } else {
        // RETOMAR AGENTE NO EVOLUTION - PUT para restart da instância
        const resumeResponse = await fetch(`https://evolution.serverwegrowup.com.br/instance/restart/${tableName}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_EVOLUTION_API_KEY || '066327121bd64f8356c26e9edfa1799d'
          }
        })
        
        if (resumeResponse.ok) {
          console.log('✅ Agente retomado no Evolution com sucesso')
        } else {
          console.error('❌ Erro ao retomar agente no Evolution:', resumeResponse.status)
          throw new Error('Falha ao retomar agente no Evolution')
        }
      }
      
      // Atualizar estado local após confirmação do Evolution
      setConversations(prev => 
        prev.map(conv => 
          conv.remotejid === remotejid 
            ? { ...conv, isPaused: newPauseStatus }
            : conv
        )
      )
      
      // Atualizar conversa selecionada
      setSelectedConversation(prev => 
        prev?.remotejid === remotejid 
          ? { ...prev, isPaused: newPauseStatus }
          : prev
      )
      
      // Mostrar toast de confirmação
      toast({
        title: newPauseStatus ? "Agente Pausado" : "Agente Retomado",
        description: newPauseStatus 
          ? "O agente AI foi pausado no Evolution. Você pode responder diretamente pelo WhatsApp."
          : "O agente AI foi reativado no Evolution e voltará a responder automaticamente.",
        variant: newPauseStatus ? "destructive" : "default",
      })
      
      console.log(`✅ Conversa ${newPauseStatus ? 'pausada' : 'retomada'} no Evolution com sucesso`)
      
    } catch (error) {
      console.error('❌ Erro ao pausar/retomar conversa no Evolution:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível pausar/retomar o agente no Evolution.",
        variant: "destructive",
      })
    }
  }, [user?.email, conversations, getUserTableName, toast])

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading,
    togglePauseConversation,
    fetchConversations
  }
}
