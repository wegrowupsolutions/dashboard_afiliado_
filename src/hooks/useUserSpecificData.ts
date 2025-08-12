import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export function useUserSpecificData() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalLeads: 0,
    newClientsThisMonth: 0,
    monthlyGrowth: [],
    recentClients: [],
    baseLeadsTableName: null as string | null,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const refetchStats = useCallback(async () => {
    if (!user?.cliente_id && !user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Get the user's base_leads table name from cliente_config
      const userId = user.cliente_id || user.id
      const { data: configData, error: configError } = await supabase
        .from("cliente_config")
        .select("base_leads")
        .eq("cliente_id", userId)
        .single()

      if (configError && configError.code !== "PGRST116") {
        throw configError
      }

      const baseLeadsTableName = configData?.base_leads
      console.log("🔍 Buscando dados da tabela:", baseLeadsTableName)

      let totalLeads = 0
      let totalClients = 0
      let newClientsThisMonth = 0
      let monthlyGrowthData = []
      let recentClients = []

      if (baseLeadsTableName) {
        // Query the user's specific base_leads table
        console.log(`📊 Consultando tabela: ${baseLeadsTableName}`)

        // Get total leads from user's specific table
        const { count: userTotalLeads, error: leadsError } = await supabase
          .from(baseLeadsTableName)
          .select("*", { count: "exact" })

        if (leadsError) {
          console.error(
            `❌ Erro ao consultar ${baseLeadsTableName}:`,
            leadsError
          )
          // Se a tabela não existir, mostrar dados zerados mas sem erro
          totalLeads = 0
          totalClients = 0
        } else {
          totalLeads = userTotalLeads || 0
          totalClients = userTotalLeads || 0 // Cada lead é um cliente potencial
          console.log(
            `✅ Leads encontrados em ${baseLeadsTableName}:`,
            totalLeads
          )
        }
      } else {
        console.log("⚠️ base_leads não configurado para este usuário")
        totalLeads = 0
        totalClients = 0
      }

      // Calculate new clients this month
      if (baseLeadsTableName) {
        const today = new Date()
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )

        const { count: newThisMonth } = await supabase
          .from(baseLeadsTableName)
          .select("*", { count: "exact" })
          .gte("created_at", firstDayOfMonth.toISOString())
          .lte("created_at", today.toISOString())

        newClientsThisMonth = newThisMonth || 0

        // Fetch monthly growth data
        const currentYear = new Date().getFullYear()
        monthlyGrowthData = []

        for (let month = 0; month < 12; month++) {
          const startOfMonth = new Date(currentYear, month, 1)
          const endOfMonth = new Date(currentYear, month + 1, 0)

          const { count } = await supabase
            .from(baseLeadsTableName)
            .select("*", { count: "exact" })
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString())

          const monthNames = [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ]
          monthlyGrowthData.push({
            month: monthNames[month],
            clients: count || 0,
          })
        }

        // Fetch recent clients from user's specific table
        const { data: recentClientsData } = await supabase
          .from(baseLeadsTableName)
          .select("id, nome, remotejid, created_at")
          .order("created_at", { ascending: false })
          .limit(5)

        recentClients =
          recentClientsData?.map((client) => ({
            id: client.id,
            name: client.nome || "Lead sem nome",
            phone: client.remotejid || "N/A",
            leads: 1,
            lastVisit: new Date(client.created_at).toLocaleDateString("pt-BR"),
          })) || []
      } else {
        // Se não há tabela configurada, dados zerados
        newClientsThisMonth = 0
        monthlyGrowthData = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ].map((month) => ({ month, clients: 0 }))
        recentClients = []
      }

      // Update stats
      setStats({
        totalClients,
        totalLeads,
        newClientsThisMonth,
        monthlyGrowth: monthlyGrowthData,
        recentClients,
        baseLeadsTableName,
      })
    } catch (error) {
      console.error("Error fetching user-specific stats:", error)
      toast({
        title: "Erro ao atualizar estatísticas",
        description:
          "Ocorreu um erro ao atualizar as estatísticas específicas do usuário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, user?.id])

  return { stats, loading, refetchStats }
}
