import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bot, Search, Pause, Play, Clock, AlertCircle, MessageCircle, User, Send, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useRealTimeChats, RealChatConversation } from "@/hooks/useRealTimeChats"

const ChatsDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    loading,
    togglePauseConversation,
    fetchConversations
  } = useRealTimeChats()

  // Filtrar conversas por busca
  const filteredConversations = conversations.filter(conv =>
    conv.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.remotejid.includes(searchTerm)
  )

  // Formatar tempo relativo
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return `${Math.floor(diffInMinutes / 1440)}d atrás`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chats - Afiliado AI
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Tempo Real
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo, {user.email}
          </p>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Coluna Esquerda - Lista de Conversas */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Busca */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Carregando conversas...
                </p>
              </div>
            ) : filteredConversations.length > 0 ? (
              <>
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredConversations.length} conversas ativas
                  </p>
                </div>
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.remotejid}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.remotejid === conversation.remotejid
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.nome}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePauseConversation(conversation.remotejid)
                        }}
                        className="p-1 h-6 w-6"
                      >
                        {conversation.isPaused ? (
                          <Play className="w-3 h-3 text-green-500" />
                        ) : (
                          <Pause className="w-3 h-3 text-orange-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.remotejid}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {conversation.messages.length > 0 
                          ? `${conversation.messages.length} mensagens`
                          : 'Nova conversa iniciada'
                        }
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatRelativeTime(conversation.lastActivity)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa com mensagens disponível'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Área Central - Chat */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-l border-r border-gray-200 dark:border-gray-700">
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.nome}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.remotejid}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedConversation.isPaused ? "destructive" : "default"}>
                    {selectedConversation.isPaused ? "Pausado" : "Ativo"}
                  </Badge>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isFromClient ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromClient
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.parts[0]?.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromClient 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-blue-100'
                        }`}>
                          {(() => {
                            try {
                              // Converter UTC para horário local (-03:00)
                              const timestamp = new Date(message.timestamp)
                              if (isNaN(timestamp.getTime())) {
                                return 'Timestamp inválido'
                              }
                              
                              // Formatar no fuso horário de Brasília
                              return timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'America/Sao_Paulo'
                              })
                            } catch (error) {
                              return 'Timestamp inválido'
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma mensagem nesta conversa
                    </p>
                  </div>
                )}
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={selectedConversation.isPaused}
                  />
                  <Button 
                    size="sm"
                    disabled={selectedConversation.isPaused}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha um cliente da lista para ver as mensagens
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita - Informações do Lead */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
          {selectedConversation ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informações do Lead
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedConversation.nome}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedConversation.remotejid}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <Badge variant={selectedConversation.isPaused ? "destructive" : "default"}>
                    {selectedConversation.isPaused ? "Pausado" : "Ativo"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Última Atividade
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatRelativeTime(selectedConversation.lastActivity)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total de Mensagens
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedConversation.messages.length} mensagens
                  </p>
                </div>
              </div>
              <Button
                onClick={() => togglePauseConversation(selectedConversation.remotejid)}
                variant={selectedConversation.isPaused ? "default" : "destructive"}
                className="w-full mt-6"
              >
                {selectedConversation.isPaused ? "Retomar Conversa" : "Pausar Conversa"}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Escolha uma conversa para ver os detalhes e gerenciar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatsDashboard