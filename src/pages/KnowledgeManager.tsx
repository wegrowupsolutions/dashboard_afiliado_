import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

import { Bot, LogOut, ArrowLeft, ArrowUpRight, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useToast } from "@/hooks/use-toast"

// Import refactored components
import SearchBar from "@/components/knowledge/SearchBar"
import DocumentGrid from "@/components/knowledge/DocumentGrid"
import AddDocumentDialog from "@/components/knowledge/AddDocumentDialog"
import { useDynamicStorage } from "@/hooks/useDynamicStorage"

const KnowledgeManager = () => {
  const { user, signOut, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)

  // Use dynamic storage for file management
  const { files, isLoadingFiles, listFiles, deleteFile } = useDynamicStorage()

  // Convert files to documents format
  const documents = files.map((file, index) => ({
    id: index + 1,
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    uploadedAt: new Date(file.created_at).toLocaleDateString(),
    category: "Geral", // Todos os arquivos na categoria geral
    titulo: file.name,
  }))

  const isLoading = isLoadingFiles
  const isRefreshing = isLoadingFiles

  // Load files on component mount
  useEffect(() => {
    listFiles()
  }, [])

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  // Handle refresh
  const handleRefresh = () => {
    listFiles()
    toast({
      title: "Atualizando arquivos",
      description: "Os arquivos estão sendo carregados do storage.",
    })
  }

  // Handle delete document
  const handleDeleteDocument = async (id: number, title: string) => {
    console.log(`🗑️ Tentando deletar: "${title}"`)
    console.log(
      "📋 Arquivos disponíveis:",
      files.map((f) => ({ id: f.id, name: f.name }))
    )

    const file = files.find((f) => f.name === title || f.id === title)
    console.log("📁 Arquivo encontrado:", file)

    if (file) {
      console.log(`🔥 Deletando arquivo: ${file.id}`)
      const success = await deleteFile(file.id)
      if (success) {
        console.log("✅ Arquivo deletado com sucesso!")
        listFiles() // Refresh after delete
      } else {
        console.log("❌ Falha ao deletar arquivo")
      }
    } else {
      console.log("❌ Arquivo não encontrado para deletar")
      toast({
        title: "Erro",
        description: "Arquivo não encontrado.",
        variant: "destructive",
      })
    }
  }

  // Handle clear all documents
  const clearAllDocuments = async () => {
    try {
      console.log(`🗑️ Iniciando limpeza de ${files.length} arquivos...`)

      if (files.length === 0) {
        toast({
          title: "Nenhum arquivo encontrado",
          description: "Não há arquivos para remover.",
        })
        return
      }

      let deletedCount = 0
      let errorCount = 0

      for (const file of files) {
        try {
          const success = await deleteFile(file.id)
          if (success) {
            deletedCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Erro ao deletar ${file.name}:`, error)
          errorCount++
        }
      }

      // Refresh file list
      await listFiles()

      if (errorCount === 0) {
        toast({
          title: "Base de conhecimento limpa",
          description: `${deletedCount} arquivo(s) removido(s) com sucesso!`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Limpeza parcial",
          description: `${deletedCount} arquivo(s) removido(s), ${errorCount} erro(s).`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro inesperado ao limpar arquivos:", error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível limpar a base de conhecimento.",
        variant: "destructive",
      })
    }
  }

  // Handle upload success
  const handleUploadSuccess = () => {
    listFiles() // Refresh file list after upload
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <div className="h-16 w-16 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-[#1F2937] text-white shadow-md transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDashboard}
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Base de Conhecimento
          </h2>
        </div>

        {/* Knowledge Base Content */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Search and Action Buttons */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={handleRefresh}
              onAddDocument={() => setIsAddDocumentOpen(true)}
              onClearAll={clearAllDocuments}
              isRefreshing={isRefreshing}
            />

            {/* Document Grid */}
            <DocumentGrid
              documents={documents}
              searchQuery={searchQuery}
              onDeleteDocument={handleDeleteDocument}
            />

            {/* Add Document Dialog */}
            <AddDocumentDialog
              isOpen={isAddDocumentOpen}
              onOpenChange={setIsAddDocumentOpen}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default KnowledgeManager
