import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  LogOut,
  ArrowLeft,
  ArrowUpRight,
  Upload,
  HardDrive,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useToast } from "@/hooks/use-toast"

// Import refactored components
import SearchBar from "@/components/knowledge/SearchBar"
import DocumentGrid from "@/components/knowledge/DocumentGrid"
import AddDocumentDialog from "@/components/knowledge/AddDocumentDialog"
import { useDocuments } from "@/hooks/useDocuments"
import { useFileStorage } from "@/hooks/useFileStorage"

const KnowledgeManager = () => {
  const { user, signOut, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("documents")
  const [fileSearchQuery, setFileSearchQuery] = useState("")
  const [selectedFileType, setSelectedFileType] = useState("")

  // Use the custom hook for document management
  const {
    documents,
    isLoading,
    isRefreshing,
    handleRefresh,
    handleDeleteDocument,
    uploadFileToWebhook,
    clearAllDocuments,
  } = useDocuments()

  // Use the custom hook for file storage
  const { files, storageUsage, isLoadingFiles, refetchFiles, formatFileSize } =
    useFileStorage()

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  // Handle adding a new document
  const handleAddDocument = async (file: File, category: string) => {
    await uploadFileToWebhook(file, category)
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

          {/* Storage Usage Summary */}
          {storageUsage && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                {storageUsage.totalFiles} arquivos
              </div>
              <div>{formatFileSize(storageUsage.totalSize)} utilizados</div>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Arquivos
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
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
                onAddDocument={handleAddDocument}
              />
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {/* File Upload Zone */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Upload de Arquivos
                </h3>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      toast({ title: "Funcionalidade em desenvolvimento" })
                    }
                  >
                    Selecionar Arquivos
                  </Button>
                </div>
              </div>

              {/* File List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum arquivo encontrado
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default KnowledgeManager
