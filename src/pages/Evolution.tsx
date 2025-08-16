import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Link,
  Bot,
  Plus,
  QrCode,
  Loader2,
  RefreshCw,
  Check,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const Evolution = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [instanceName, setInstanceName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<
    "waiting" | "confirmed" | "failed" | null
  >(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [hasCreatedInstance, setHasCreatedInstance] = useState(false)
  const statusCheckIntervalRef = useRef<number | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3

  // API da Evolution para logout e delete da instância
  const EVOLUTION_API_BASE = "https://evolution.serverwegrowup.com.br"
  const EVOLUTION_API_KEY = "066327121bd64f8356c26e9edfa1799d"

  useEffect(() => {
    return () => {
      if (statusCheckIntervalRef.current !== null) {
        clearInterval(statusCheckIntervalRef.current)
      }
    }
  }, [])

  // Check for existing instances when component loads
  useEffect(() => {
    const checkOnLoad = async () => {
      console.log("🎯 Evolution component loaded - checking user and instances")
      console.log("👤 Current user:", {
        exists: !!user,
        id: user?.id,
        idType: typeof user?.id,
        email: user?.email,
        metadata: user?.user_metadata,
      })

      if (user?.cliente_id) {
        console.log("✅ User authenticated, checking for existing instances...")
        const hasInstance = await checkExistingInstance()
        console.log("📋 Instance check result:", hasInstance)
        setHasCreatedInstance(hasInstance)
      } else {
        console.log("❌ No user authenticated or missing cliente_id")
      }
    }
    checkOnLoad()
  }, [user?.cliente_id])

  const checkConnectionStatus = async () => {
    try {
      console.log("Checking connection status for:", instanceName)
      const response = await fetch(
        "https://webhook.serverwegrowup.com.br/webhook/confirma",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: instanceName.trim(),
          }),
        }
      )

      if (response.ok) {
        const responseText = await response.text()
        console.log("Connection status response:", responseText)

        let responseData

        try {
          responseData = JSON.parse(responseText)
          console.log("Parsed response data:", responseData)
        } catch (parseError) {
          console.error("Error parsing response JSON:", parseError)
          toast({
            title: "Erro no formato da resposta",
            description: "Não foi possível processar a resposta do servidor.",
            variant: "destructive",
          })
          return
        }

        if (responseData && typeof responseData.respond === "string") {
          const status = responseData.respond
          console.log("Response status value:", status)

          if (status === "positivo") {
            console.log("Connection confirmed - stopping interval")
            if (statusCheckIntervalRef.current !== null) {
              clearInterval(statusCheckIntervalRef.current)
              statusCheckIntervalRef.current = null
            }
            setConfirmationStatus("confirmed")
            retryCountRef.current = 0 // Reset retry counter on success
            toast({
              title: "Conexão estabelecida!",
              description: "Seu WhatsApp foi conectado com sucesso.",
              variant: "default",
            })
          } else if (status === "negativo") {
            retryCountRef.current += 1
            console.log(
              `Connection failed - attempt ${retryCountRef.current} of ${maxRetries}`
            )

            if (retryCountRef.current >= maxRetries) {
              console.log("Maximum retry attempts reached - updating QR code")
              if (statusCheckIntervalRef.current !== null) {
                clearInterval(statusCheckIntervalRef.current)
                statusCheckIntervalRef.current = null
              }
              setConfirmationStatus("failed")
              retryCountRef.current = 0 // Reset retry counter
              toast({
                title: "Falha na conexão",
                description:
                  "Não foi possível conectar após várias tentativas. Obtendo novo QR code...",
                variant: "destructive",
              })
              updateQrCode() // Automatically get a new QR code
            } else {
              console.log(
                `Retrying... (${retryCountRef.current}/${maxRetries})`
              )
              toast({
                title: "Tentando novamente",
                description: `Tentativa ${retryCountRef.current} de ${maxRetries}`,
                variant: "default",
              })
            }
          } else {
            console.log("Unknown status value:", status)
            toast({
              title: "Status desconhecido",
              description: "Recebemos uma resposta inesperada do servidor.",
              variant: "destructive",
            })
          }
        } else {
          console.log(
            "Response does not have a valid respond property:",
            responseData
          )
          toast({
            title: "Formato inesperado",
            description: "A resposta do servidor não está no formato esperado.",
            variant: "destructive",
          })
        }
      } else {
        console.error("Erro ao verificar status:", await response.text())
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar o status da conexão.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao verificar status da conexão:", error)
      toast({
        title: "Erro de conexão",
        description: "Ocorreu um erro ao verificar o status da conexão.",
        variant: "destructive",
      })
    }
  }

  const updateQrCode = async () => {
    try {
      setIsLoading(true)
      console.log("Updating QR code for instance:", instanceName)
      const response = await fetch(
        "https://webhook.serverwegrowup.com.br/webhook/atualizar-qr-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: instanceName.trim(),
          }),
        }
      )

      console.log("QR code update response status:", response.status)

      if (response.ok) {
        const blob = await response.blob()
        console.log("Received blob content type:", blob.type)

        const qrCodeUrl = URL.createObjectURL(blob)
        setQrCodeData(qrCodeUrl)
        setConfirmationStatus("waiting")
        retryCountRef.current = 0 // Reset retry counter when getting new QR code
        console.log("QR code updated successfully")

        if (statusCheckIntervalRef.current !== null) {
          clearInterval(statusCheckIntervalRef.current)
        }

        console.log("Starting new polling interval")
        statusCheckIntervalRef.current = window.setInterval(() => {
          checkConnectionStatus()
        }, 10000)

        toast({
          title: "QR Code atualizado",
          description: "Escaneie o novo QR code para conectar seu WhatsApp.",
        })
      } else {
        const errorText = await response.text()
        console.error("Falha ao atualizar QR code:", errorText)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o QR code. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar QR code:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o QR code.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user already has an instance saved
  const checkExistingInstance = async () => {
    try {
      console.log("🔍 SUPER DEBUG - Checking for existing instance")
      console.log("👤 User object:", user)
      console.log("🔑 User cliente_id:", user?.cliente_id)
      console.log("🆔 User id:", user?.id)
      console.log("📧 User email:", user?.email)
      console.log("🔒 User exists:", !!user)

      if (!user?.cliente_id) {
        console.log("❌ ERRO CRÍTICO: No cliente_id available!")
        console.log("🔄 Tentando usar user.id como fallback:", user?.id)

        // FALLBACK: Se não tem cliente_id, usar user.id
        if (!user?.id) {
          console.log("❌ ERRO FATAL: Nem cliente_id nem id disponível!")
          return false
        }
      }

      // Use cliente_id ou user.id como fallback
      const searchId = user.cliente_id || user.id
      console.log("🔍 Usando ID para busca:", searchId)

      // Use cliente_id (UUID) para verificar instâncias
      const { data, error } = await supabase
        .from("cliente_config")
        .select("evo_instance, cliente_id")
        .eq("cliente_id", searchId)
        .limit(1)

      console.log("📊 SUPER DEBUG Query result:", {
        searchId,
        data,
        error,
        hasInstance: !!data && data.length > 0,
        dataLength: data?.length,
        queryUsed: `SELECT evo_instance FROM cliente_config WHERE cliente_id = '${searchId}' AND evo_instance IS NOT NULL LIMIT 1`,
      })

      if (error) {
        console.error("❌ Error checking existing instance:", error)
        console.log("🔍 Error code:", error.code)
        console.log("🔍 Error message:", error.message)

        // If it's just a "no rows found" error, that's actually expected for new users
        if (error.code === "PGRST116") {
          console.log(
            "✅ No existing instance found (this is normal for new users)"
          )
          return false
        }
        return false
      }

      // Verificar se existe registro E se evo_instance está preenchido
      const hasRecord = !!(data && data.length > 0)

      console.log("🔍 SUPER DEBUG - Data array:", data)
      console.log("🔍 SUPER DEBUG - Data length:", data?.length)
      console.log("🔍 SUPER DEBUG - First record:", data?.[0])
      console.log("🔍 SUPER DEBUG - evo_instance raw:", data?.[0]?.evo_instance)
      console.log(
        "🔍 SUPER DEBUG - evo_instance type:",
        typeof data?.[0]?.evo_instance
      )
      console.log(
        "🔍 SUPER DEBUG - evo_instance length:",
        data?.[0]?.evo_instance?.length
      )
      console.log(
        "🔍 SUPER DEBUG - evo_instance after trim:",
        data?.[0]?.evo_instance?.trim()
      )

      const evoInstanceValue = data?.[0]?.evo_instance
      const hasEvoInstance =
        hasRecord && evoInstanceValue && evoInstanceValue.trim() !== ""

      console.log("✅ RESULTADO FINAL - Has record:", hasRecord)
      console.log("✅ RESULTADO FINAL - Has evo_instance:", hasEvoInstance)
      console.log("✅ RESULTADO FINAL - evo_instance value:", evoInstanceValue)

      if (hasEvoInstance) {
        console.log("📋 Existing instance details:", data[0])
        console.log("🚨 DEVERIA BLOQUEAR CRIAÇÃO DE NOVA INSTÂNCIA!")
        console.log("🚨 evo_instance preenchido:", data[0].evo_instance)
      } else if (hasRecord) {
        console.log(
          "✅ Registro existe mas evo_instance vazio, pode criar nova"
        )
      } else {
        console.log("✅ Nenhum registro encontrado, pode criar nova")
      }

      return hasEvoInstance
    } catch (error) {
      console.error("❌ Unexpected error checking existing instance:", error)
      return false
    }
  }

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a instância.",
        variant: "destructive",
      })
      return
    }

    // 🛡️ PRIMEIRA VERIFICAÇÃO: Estado local (mais rápida)
    console.log("🔍 Step 1: Checking local state...")
    console.log("📋 Local state hasCreatedInstance:", hasCreatedInstance)

    if (hasCreatedInstance) {
      console.log(
        "🚫 Instance already exists (local state) - showing limit modal"
      )
      setShowLimitModal(true)
      return
    }

    // 🛡️ VERIFICAÇÃO SIMPLES: Check if evo_instance is filled
    console.log("🔍 Checking evo_instance...")
    console.log("👤 User object:", user)
    console.log("📧 USUÁRIO TESTANDO:", user?.email || "EMAIL NÃO DEFINIDO")
    console.log("🔑 User cliente_id:", user?.cliente_id)
    console.log("🆔 User id:", user?.id)

    // Verificar se o usuário está autenticado
    if (!user || (!user.cliente_id && !user.id)) {
      console.error("❌ User not authenticated or missing cliente_id/id")
      toast({
        title: "Erro de autenticação",
        description: "Usuário não está autenticado. Faça login novamente.",
        variant: "destructive",
      })
      return
    }

    const searchId = user.cliente_id || user.id
    console.log("🔍 Using search ID:", searchId, "Type:", typeof searchId)

    try {
      // Buscar por AMBOS os IDs: cliente_id E user.id (para compatibilidade)
      const { data, error } = await supabase
        .from("cliente_config")
        .select("evo_instance, cliente_id")
        .in("cliente_id", [user.cliente_id, user.id])
        .limit(1)

      console.log("📊 Query result:", {
        data,
        error,
        searchClienteId: user.cliente_id,
        searchUserId: user.id,
        userEmail: user.email,
        dataLength: data?.length,
        hasRecords: !!(data && data.length > 0),
        evoInstanceValue: data?.[0]?.evo_instance,
        evoInstanceExists: !!data?.[0]?.evo_instance,
      })

      if (error) {
        console.error("❌ Error checking evo_instance:", error)
      } else if (data && data.length > 0 && data[0].evo_instance) {
        // SE TEM EVO_INSTANCE PREENCHIDO = BLOQUEAR
        console.log(
          "🚨 BLOQUEANDO: evo_instance já existe:",
          data[0].evo_instance
        )
        setShowLimitModal(true)
        return
      }
      console.log("✅ evo_instance vazio - permitindo criação")
    } catch (error) {
      console.error("❌ Error in evo_instance check:", error)
    }

    setIsLoading(true)
    setQrCodeData(null)
    setConfirmationStatus(null)
    retryCountRef.current = 0 // Reset retry counter for new instance creation

    try {
      console.log("🚀 Creating instance with name:", instanceName)

      // Validate user authentication
      if (!user || !user.id) {
        console.error("❌ User not authenticated or missing ID")
        toast({
          title: "Erro de autenticação",
          description: "Usuário não está autenticado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const userIdString = user.id.toString()
      console.log("👤 User authentication details:", {
        userExists: !!user,
        userId: user.id,
        userIdType: typeof user.id,
        userIdString: userIdString,
        userEmail: user.email,
        userMetadata: user.user_metadata,
      })

      // Send user data to backend so it can generate cliente_id and create database entries
      const requestData = {
        instanceName: instanceName.trim(),
        user_data: {
          id: user.id, // UUID
          cliente_id: user.cliente_id, // UUID para relacionamentos
          email: user.email,
          name: user.user_metadata?.name,
          phone: user.user_metadata?.phone,
        },
      }

      console.log("📤 Sending data to backend:", requestData)
      console.log("📤 JSON payload:", JSON.stringify(requestData, null, 2))

      const response = await fetch(
        "https://webhook.serverwegrowup.com.br/webhook/instanciaevolution",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      )

      console.log("📥 Backend response details:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Check if response is successful
      if (response.ok) {
        const blob = await response.blob()
        console.log("Received blob content type:", blob.type)

        const qrCodeUrl = URL.createObjectURL(blob)
        setQrCodeData(qrCodeUrl)
        setConfirmationStatus("waiting")

        if (statusCheckIntervalRef.current !== null) {
          clearInterval(statusCheckIntervalRef.current)
        }

        console.log("Starting status checking interval")
        statusCheckIntervalRef.current = window.setInterval(() => {
          checkConnectionStatus()
        }, 10000)

        // Backend handles database creation with client_id generation
        console.log(
          "⏳ Backend processará e criará configuração com cliente_id..."
        )

        // Set local state to prevent multiple creation attempts
        setHasCreatedInstance(true)

        console.log(
          "✅ Instância criada no Evolution, backend gerenciará banco de dados"
        )

        toast({
          title: "Instância criada!",
          description: "Escaneie o QR code para conectar seu WhatsApp.",
        })
      } else {
        // Handle error response
        const errorText = await response.text()
        console.error("❌ Backend returned error:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        })

        toast({
          title: "Erro no backend",
          description: `Erro ${response.status}: ${errorText}`,
          variant: "destructive",
        })

        throw new Error(`Backend error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Erro ao criar instância:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a instância. Tente novamente.",
        variant: "destructive",
      })
      setConfirmationStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryAgain = () => {
    setIsLoading(true)
    setQrCodeData(null)
    setConfirmationStatus(null)
    retryCountRef.current = 0 // Reset retry counter
    handleCreateInstance()
  }

  const resetQrCode = () => {
    setQrCodeData(null)
    setConfirmationStatus(null)
    retryCountRef.current = 0 // Reset retry counter
    if (statusCheckIntervalRef.current !== null) {
      clearInterval(statusCheckIntervalRef.current)
      statusCheckIntervalRef.current = null
    }
  }

  const handleDeleteInstance = async () => {
    try {
      setIsLoading(true)
      console.log("🗑️ Iniciando processo de deleção da instância...")

      // 1. Primeiro buscar o nome real da instância no Supabase
      console.log("🔍 Buscando nome da instância no Supabase...")
      const searchId = user?.cliente_id || user?.id
      
      if (!searchId) {
        console.error("❌ Nenhum ID de usuário disponível")
        toast({
          title: "Erro",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const { data: instanceData, error: instanceError } = await supabase
        .from("dados_cliente")
        .select("evo_instance")
        .eq("id", searchId)
        .single()

      if (instanceError || !instanceData?.evo_instance) {
        console.error("❌ Erro ao buscar instância:", instanceError)
        console.log("📊 Dados da instância:", instanceData)
        toast({
          title: "Erro",
          description: "Não foi possível encontrar a instância para deletar.",
          variant: "destructive",
        })
        return
      }

      const realInstanceName = instanceData.evo_instance
      console.log("✅ Nome real da instância encontrado:", realInstanceName)

             // 2. Fazer logout da instância Evolution usando a API oficial
       console.log("📤 Fazendo logout da instância Evolution...")
       console.log("🗑️ Deletando instância:", realInstanceName)
       
       const logoutResponse = await fetch(`https://evolution.serverwegrowup.com.br/instance/logout/${realInstanceName}`, {
         method: "DELETE",
         headers: {
           "apikey": "066327121bd64f8356c26e9edfa1799d"
         }
       })

       // 3. Deletar completamente a instância no Evolution
       console.log("🗑️ Deletando instância completamente no Evolution...")
       const deleteResponse = await fetch(`https://evolution.serverwegrowup.com.br/instance/delete/${realInstanceName}`, {
         method: "DELETE",
         headers: {
           "apikey": "066327121bd64f8356c26e9edfa1799d"
         }
       })

             console.log("📥 Resposta do logout:", {
         status: logoutResponse.status,
         statusText: logoutResponse.statusText,
         ok: logoutResponse.ok
       })

       console.log("📥 Resposta do delete:", {
         status: deleteResponse.status,
         statusText: deleteResponse.statusText,
         ok: deleteResponse.ok
       })

             if (!logoutResponse.ok) {
         console.warn("⚠️ Logout não foi bem-sucedido, mas continuando...")
         console.warn("Status:", logoutResponse.status, "StatusText:", logoutResponse.statusText)
         
         // Tentar ler o corpo da resposta para debug
         try {
           const errorText = await logoutResponse.text()
           console.warn("📄 Corpo da resposta de erro (logout):", errorText)
         } catch (e) {
           console.warn("❌ Não foi possível ler corpo da resposta (logout)")
         }
       } else {
         console.log("✅ Logout realizado com sucesso")
         
         // Tentar ler o corpo da resposta para debug
         try {
           const successText = await logoutResponse.text()
           console.log("📄 Corpo da resposta de sucesso (logout):", successText)
         } catch (e) {
           console.log("✅ Resposta de sucesso (logout) - sem corpo")
         }
       }

       if (!deleteResponse.ok) {
         console.warn("⚠️ Delete não foi bem-sucedido, mas continuando...")
         console.warn("Status:", deleteResponse.status, "StatusText:", deleteResponse.statusText)
         
         // Tentar ler o corpo da resposta para debug
         try {
           const errorText = await deleteResponse.text()
           console.warn("📄 Corpo da resposta de erro (delete):", errorText)
         } catch (e) {
           console.warn("❌ Não foi possível ler corpo da resposta (delete)")
         }
       } else {
         console.log("✅ Delete realizado com sucesso")
         
         // Tentar ler o corpo da resposta para debug
         try {
           const successText = await deleteResponse.text()
           console.log("📄 Corpo da resposta de sucesso (delete):", successText)
         } catch (e) {
           console.log("✅ Resposta de sucesso (delete) - sem corpo")
         }
       }

             // 4. Limpar dados do Supabase
      console.log("🧹 Limpando dados do Supabase...")
      
             if (searchId) {
         const { error: updateError } = await supabase
           .from("dados_cliente")
           .update({ 
             evo_instance: null,
             base_leads: null,
             bucket_name: null,
             evo_created_at: null,
             evo_updated_at: null,
             numero_evo: null
           })
           .eq("id", searchId)

        if (updateError) {
          console.error("❌ Erro ao limpar dados do Supabase:", updateError)
        } else {
          console.log("✅ Dados do Supabase limpos com sucesso")
        }
      }

             // 5. Resetar estado local
      setHasCreatedInstance(false)
      setShowLimitModal(false)
      setInstanceName("")
      setQrCodeData(null)
      setConfirmationStatus(null)

             // 6. Mostrar mensagem de sucesso
      toast({
        title: "✅ Instância deletada!",
        description: "Sua instância foi removida com sucesso. Agora você pode criar uma nova.",
        variant: "default",
      })

      console.log("🎉 Processo de deleção concluído com sucesso!")

    } catch (error) {
      console.error("❌ Erro durante deleção da instância:", error)
      toast({
        title: "Erro ao deletar instância",
        description: "Ocorreu um erro durante o processo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-[#1F2937] text-white shadow-md transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Bot className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold">Afiliado AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-0 px-3 py-1"
            >
              Bem-vindo, {user?.user_metadata?.name || user?.email}
            </Badge>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={signOut}
              className="border-white text-white bg-gray-950/50 hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Link className="h-6 w-6 text-green-500 dark:text-green-400" />
            Conectar Evolution
          </h2>
        </div>

        <div className="max-w-xl mx-auto">
          <Card className="dark:bg-gray-800 shadow-lg border-green-100 dark:border-green-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                {qrCodeData ? (
                  <QrCode className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                {qrCodeData ? "Conectar WhatsApp" : "Criar Nova Instância"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {qrCodeData ? (
                <div className="space-y-6 text-center">
                  {confirmationStatus === "waiting" ? (
                    <>
                      <div className="bg-white p-4 rounded-md inline-block mx-auto">
                        <img
                          src={qrCodeData}
                          alt="QR Code para conectar WhatsApp"
                          className="mx-auto max-w-full h-auto"
                          style={{ maxHeight: "250px" }}
                        />
                      </div>

                      <div className="space-y-2 text-center">
                        <h3 className="font-medium text-lg">
                          Conecte seu WhatsApp
                        </h3>
                        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left list-decimal pl-5">
                          <li>Abra o WhatsApp no seu celular</li>
                          <li>
                            Toque em Menu ou Configurações e selecione Aparelhos
                            conectados
                          </li>
                          <li>Toque em Conectar um aparelho</li>
                          <li>Escaneie o código QR</li>
                        </ol>

                        <div className="mt-4 flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            Aguardando conexão
                            {retryCountRef.current > 0
                              ? ` (Tentativa ${retryCountRef.current}/${maxRetries})`
                              : "..."}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : confirmationStatus === "confirmed" ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Conectado com Sucesso!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Seu WhatsApp foi conectado à instância{" "}
                        <span className="font-semibold">{instanceName}</span>.
                      </p>
                      <Button
                        onClick={() => navigate("/dashboard")}
                        variant="default"
                        className="mt-4"
                      >
                        Voltar ao Dashboard
                      </Button>
                    </div>
                  ) : confirmationStatus === "failed" ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-red-600 dark:text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Falha na Conexão
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Não foi possível conectar o WhatsApp à instância{" "}
                        <span className="font-semibold">{instanceName}</span>{" "}
                        após várias tentativas.
                      </p>
                      <Button
                        onClick={handleTryAgain}
                        variant="default"
                        className="mt-4 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </span>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Tentar Novamente
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}

                  {confirmationStatus !== "confirmed" &&
                    confirmationStatus !== "failed" && (
                      <Button
                        onClick={resetQrCode}
                        variant="outline"
                        className="mt-4"
                      >
                        Voltar
                      </Button>
                    )}
                </div>
              ) : (
                <>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="instance-name">Nome da Instância</Label>
                      <Input
                        id="instance-name"
                        placeholder="Ex: Atendimento Principal"
                        className="dark:bg-gray-700"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleCreateInstance}
                      className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </span>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Instância
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-amber-500" />
              Instância Já Existente
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Detectamos que você já possui uma instância Evolution ativa.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-200 text-sm">
                <strong>Limite de Segurança:</strong> Para garantir a
                estabilidade, cada usuário pode ter apenas uma instância
                Evolution ativa por vez.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Como proceder:</strong> Se precisar de uma nova
                configuração, você pode editar sua instância atual nas
                configurações.
              </p>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-200 text-sm">
                <strong>Já conectado?</strong> Se sua instância já está
                funcionando, você pode voltar ao dashboard e começar a usar!
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Ir ao Dashboard
            </Button>
            <Button
              onClick={() => setShowLimitModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-400 hover:border-green-300"
            >
              Entendi
            </Button>
            <Button
              onClick={() => handleDeleteInstance()}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white border-2 border-red-400 hover:border-red-300"
            >
              Deletar Instância
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Evolution
