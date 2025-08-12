import { useState, useEffect } from "react"
import { Contact } from "@/types/client"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"

export const useUserClientManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isPauseDurationDialogOpen, setIsPauseDurationDialogOpen] =
    useState(false)
  const [messageText, setMessageText] = useState("")
  const [baseLeadsTableName, setBaseLeadsTableName] = useState<string | null>(
    null
  )
  const { user } = useAuth()

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    cpfCnpj: "",
    asaasCustomerId: "",
    status: "Active",
    notes: "",
  })

  // Get user's base_leads table configuration
  const getUserConfig = async () => {
    if (!user?.cliente_id && !user?.id) return null

    try {
      const userId = user.cliente_id || user.id
      const { data, error } = await supabase
        .from("cliente_config")
        .select("base_leads")
        .eq("cliente_id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user config:", error)
        return null
      }

      return data?.base_leads || null
    } catch (error) {
      console.error("Error getting user config:", error)
      return null
    }
  }

  const fetchClients = async () => {
    if (!user?.cliente_id && !user?.id) return

    try {
      setLoadingContacts(true)

      // Get user's table configuration
      const userId = user.cliente_id || user.id
      const tableConfig = await getUserConfig()
      setBaseLeadsTableName(tableConfig)

      console.log("🔍 Buscando leads da tabela:", tableConfig)

      if (tableConfig) {
        // Query the user's specific base_leads table
        const { data, error } = await supabase.from(tableConfig).select("*")

        if (error) {
          console.error(`❌ Erro ao consultar ${tableConfig}:`, error)
          setContacts([])
          return
        }

        if (data) {
          const formattedContacts: Contact[] = data.map((client) => ({
            id: client.id.toString(),
            name: client.nome || "Lead sem nome",
            email: client.email || "N/A",
            phone: client.remotejid || "N/A",
            cpfCnpj: "",
            asaasCustomerId: "",
            payments: null,
            status: "Active",
            notes: "",
            lastContact: client.created_at
              ? new Date(client.created_at).toLocaleDateString("pt-BR")
              : "Desconhecido",
          }))

          console.log(
            `✅ ${formattedContacts.length} leads encontrados em ${tableConfig}`
          )
          setContacts(formattedContacts)
        }
      } else {
        console.log("⚠️ base_leads não configurado - mostrando dados vazios")
        setContacts([])
      }
    } catch (error) {
      console.error("Error fetching user-specific clients:", error)
      toast({
        title: "Erro ao carregar leads",
        description:
          "Ocorreu um erro ao buscar os leads específicos do usuário.",
        variant: "destructive",
      })
    } finally {
      setLoadingContacts(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchClients()
    toast({
      title: "Atualizando dados",
      description: "Os dados da sua base de leads estão sendo atualizados.",
    })
  }

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDetailSheetOpen(true)
  }

  const handleAddContact = async () => {
    if (
      !newContact.name ||
      !newContact.phone ||
      (!user?.cliente_id && !user?.id)
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      const tableConfig = await getUserConfig()

      if (!tableConfig) {
        toast({
          title: "Configuração não encontrada",
          description: "Sua tabela de leads não está configurada.",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from(tableConfig)
        .insert([
          {
            nome: newContact.name,
            remotejid: newContact.phone,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        fetchClients()

        setNewContact({
          name: "",
          email: "",
          phone: "",
          address: "",
          cpfCnpj: "",
          asaasCustomerId: "",
          status: "Active",
          notes: "",
        })

        setIsAddContactOpen(false)

        toast({
          title: "Lead adicionado",
          description: `${newContact.name} foi adicionado à sua base de leads.`,
        })

        // Webhook call mantido para compatibilidade
        try {
          const userId = user.cliente_id || user.id
          await fetch(
            "https://webhook.serverwegrowup.com.br/webhook//cria_usuario",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...newContact,
                cliente_id: userId,
              }),
            }
          )
        } catch (webhookError) {
          console.error("Erro ao enviar para webhook:", webhookError)
        }
      }
    } catch (error) {
      console.error("Erro ao cadastrar lead:", error)
      toast({
        title: "Erro ao adicionar lead",
        description: "Não foi possível salvar o lead na sua base.",
        variant: "destructive",
      })
    }
  }

  const handleEditContact = async () => {
    if (!selectedContact || !user?.id) return

    try {
      const { error } = await supabase
        .from("dados_cliente")
        .update({
          nome: newContact.name,
          email: newContact.email,
          telefone: newContact.phone,
          cpf_cnpj: newContact.cpfCnpj,
          asaas_customer_id: newContact.asaasCustomerId,
          payments: newContact.payments,
        })
        .eq("id", parseInt(selectedContact.id))
        .eq("auth_user_id", user.id.toString()) // Ensure user can only edit their own data

      if (error) throw error

      fetchClients()

      setIsEditModalOpen(false)

      toast({
        title: "Lead atualizado",
        description: `As informações de ${selectedContact.name} foram atualizadas.`,
      })

      try {
        await fetch(
          "https://webhook.serverwegrowup.com.br/webhook/edita_usuario",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: selectedContact.id,
              ...newContact,
              auth_user_id: user.id.toString(),
            }),
          }
        )
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError)
      }
    } catch (error) {
      console.error("Erro ao atualizar lead:", error)
      toast({
        title: "Erro ao atualizar lead",
        description: "Não foi possível atualizar o lead na sua base.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async () => {
    if (!selectedContact || !user?.id) return

    try {
      const { error } = await supabase
        .from("dados_cliente")
        .delete()
        .eq("id", parseInt(selectedContact.id))
        .eq("auth_user_id", user.id.toString()) // Ensure user can only delete their own data

      if (error) throw error

      fetchClients()

      setSelectedContact(null)
      setIsDetailSheetOpen(false)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Lead removido",
        description: `${selectedContact.name} foi removido da sua base de leads.`,
        variant: "destructive",
      })

      try {
        await fetch(
          "https://webhook.serverwegrowup.com.br/webhook/exclui_usuario",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: selectedContact.phone,
              auth_user_id: user.id.toString(),
            }),
          }
        )
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError)
      }
    } catch (error) {
      console.error("Erro ao excluir lead:", error)
      toast({
        title: "Erro ao remover lead",
        description: "Não foi possível remover o lead da sua base.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
    }
  }

  const openEditModal = () => {
    if (!selectedContact) return
    setNewContact({
      name: selectedContact.name,
      email: selectedContact.email,
      phone: selectedContact.phone,
      address: selectedContact.address,
      cpfCnpj: selectedContact.cpfCnpj,
      asaasCustomerId: selectedContact.asaasCustomerId,
      payments: selectedContact.payments,
      status: selectedContact.status,
      notes: selectedContact.notes,
    })
    setIsEditModalOpen(true)
  }

  const handleMessageClick = () => {
    setMessageText("")
    setIsMessageDialogOpen(true)
  }

  const handleMessageSubmit = () => {
    if (!messageText.trim() || !selectedContact) return

    setIsMessageDialogOpen(false)
    setIsPauseDurationDialogOpen(true)
  }

  const handlePauseDurationConfirm = async (duration: number | null) => {
    if (!selectedContact || !user?.id) return

    try {
      const response = await fetch(
        "https://webhook.serverwegrowup.com.br/webhook/envia_mensagem",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: selectedContact.phone,
            message: messageText,
            pauseDuration: duration,
            auth_user_id: user.id.toString(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Falha ao enviar dados para o webhook")
      }

      setIsPauseDurationDialogOpen(false)

      toast({
        title: "Mensagem enviada",
        description:
          duration === null
            ? `Mensagem enviada para ${selectedContact.name} sem pausar o bot.`
            : `Mensagem enviada para ${selectedContact.name} e bot pausado por ${duration} segundos.`,
      })
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setIsPauseDurationDialogOpen(false)

      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem para o servidor.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchClients()
  }, [user?.id])

  return {
    contacts,
    loadingContacts,
    refreshing,
    selectedContact,
    setSelectedContact,
    isAddContactOpen,
    setIsAddContactOpen,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isMessageDialogOpen,
    setIsMessageDialogOpen,
    isPauseDurationDialogOpen,
    setIsPauseDurationDialogOpen,
    messageText,
    setMessageText,
    newContact,
    setNewContact,
    handleRefresh,
    handleContactClick,
    handleAddContact,
    handleEditContact,
    handleDeleteContact,
    openEditModal,
    handleMessageClick,
    handleMessageSubmit,
    handlePauseDurationConfirm,
    baseLeadsTableName,
  }
}
