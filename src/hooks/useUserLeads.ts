import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export interface UserLead {
  id: number
  remotejid: string
  nome: string | null
  timestamp: string | null
  created_at: string | null
  updated_at: string | null
}

export const useUserLeads = () => {
  const [leads, setLeads] = useState<UserLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchUserLeads = async () => {
    if (!user?.email) {
      setError("Usuário não autenticado")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Gerar nome da tabela baseado no email do usuário
      const tableName = generateLeadsTableName(user.email)
      console.log(`🔍 Buscando leads na tabela: ${tableName}`)
      console.log(`👤 Email do usuário: ${user.email}`)

      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.log(`🔍 Erro detalhado:`, fetchError)
        console.log(`🔍 Código do erro:`, fetchError.code)
        
        // Para qualquer erro, vamos tratar como "tabela vazia" por enquanto
        console.log(`📋 Tratando erro como tabela vazia: ${fetchError.message}`)
        setLeads([])
        setError(null)
        return
      }

      console.log(`✅ ${data?.length || 0} leads encontrados`)
      setLeads(data || [])
      setError(null)
      console.log(`🔍 Estado do erro após sucesso:`, null)
    } catch (err) {
      console.error("❌ Erro inesperado ao buscar leads:", err)
      setError("Erro inesperado ao carregar leads")
    } finally {
      setLoading(false)
    }
  }

  // Gerar nome da tabela baseado no email do usuário
  const generateLeadsTableName = (email: string): string => {
    // Extrair o nome do usuário do email (parte antes do @)
    const userName = email.split('@')[0].toLowerCase()
    const tableName = `${userName}_base_leads`
    console.log(`🏷️ Nome da tabela gerado: ${tableName}`)
    return tableName
  }

  // Buscar leads quando o componente montar ou usuário mudar
  useEffect(() => {
    if (user?.email) {
      fetchUserLeads()
    }
  }, [user?.email])

  return {
    leads,
    loading,
    error,
    refetch: fetchUserLeads,
    totalLeads: leads.length,
    recentLeads: leads.slice(0, 10), // Últimos 10 leads
  }
}
