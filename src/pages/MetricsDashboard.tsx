import React, { useEffect } from "react"
import { LineChart, Users, Smartphone, Bot } from "lucide-react"
import { useUserSpecificData } from "@/hooks/useUserSpecificData"
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime"
// Import components
import DashboardHeader from "@/components/metrics/DashboardHeader"
import StatCard from "@/components/metrics/StatCard"
//import ClientGrowthChart from '@/components/metrics/ClientGrowthChart';
//import PetTypesChart from '@/components/metrics/PetTypesChart';
// Temporarily commented - Funil de Leads functionality
// import ServicesBarChart from "@/components/metrics/ServicesBarChart"
import RecentClientsTable from "@/components/metrics/RecentClientsTable"

const MetricsDashboard = () => {
  const { stats, loading, refetchStats } = useUserSpecificData()

  // Initialize real-time updates for the metrics dashboard
  useDashboardRealtime()

  // Fetch data when component mounts
  useEffect(() => {
    refetchStats()
  }, [refetchStats])

  // Temporarily commented - Funil de Leads functionality
  /*
  // Use real data for monthly customers growth
  const monthlyCustomersData =
    stats.monthlyGrowth?.length > 0
      ? stats.monthlyGrowth
      : [
          { month: "Jan", clients: 0 },
          { month: "Fev", clients: 0 },
          { month: "Mar", clients: 0 },
          { month: "Abr", clients: 0 },
          { month: "Mai", clients: 0 },
          { month: "Jun", clients: 0 },
          { month: "Jul", clients: 0 },
          { month: "Ago", clients: 0 },
          { month: "Set", clients: 0 },
          { month: "Out", clients: 0 },
          { month: "Nov", clients: 0 },
          { month: "Dez", clients: 0 },
        ]
  */

  // Calculate funnel data automatically based on real stats
  // Temporarily commented - Funil de Leads functionality
  /*
  const calculateFunnelData = () => {
    const totalLeads = stats.totalLeads || 0
    const totalClients = stats.totalClients || 0

    // TOFU: Total leads (top of funnel - all prospects)
    const tofu = totalLeads

    // MOFU: 60% of leads (middle of funnel - qualified leads)
    const mofu = Math.round(totalLeads * 0.6)

    // BOFU: Total clients (bottom of funnel - converted customers)
    const bofu = totalClients

    return [
      { name: "TOFU", value: tofu },
      { name: "MOFU", value: mofu },
      { name: "BOFU", value: bofu },
    ]
  }

  const petServicesData = calculateFunnelData()
  */

  // Use real client data from the database
  const recentClientsData =
    stats.recentClients?.length > 0
      ? stats.recentClients
      : [
          {
            id: 1,
            name: "Carregando...",
            phone: "...",
            pets: 0,
            lastVisit: "...",
          },
        ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <LineChart className="h-6 w-6 text-green-500 dark:text-green-400" />
            Dashboard de Métricas
          </h2>
        </div>

        {/* Estatísticas em Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total de Leads"
            value={stats.totalLeads}
            icon={<Bot />}
            trend={`Média de ${(
              stats.totalLeads / (stats.totalClients || 1)
            ).toFixed(1)} leads`}
            loading={loading}
            iconBgClass="bg-green-100 dark:bg-green-900/30"
            iconTextClass="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Tabela de Leads Recentes - Largura completa para melhor aproveitamento da tela */}
        <div className="w-full">
          {/* Temporarily commented - Funil de Leads */}
          {/* <ServicesBarChart data={petServicesData} /> */}
          <RecentClientsTable clients={recentClientsData} loading={loading} />
        </div>
      </main>
    </div>
  )
}

export default MetricsDashboard
