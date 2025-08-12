import React, { useState } from "react"
import {
  FileUp,
  Upload,
  Loader2,
  FileText,
  Image,
  Video,
  Music,
  File,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDynamicStorage } from "@/hooks/useDynamicStorage"

interface AddDocumentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
  isOpen,
  onOpenChange,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileCategory, setFileCategory] = useState("")
  const { uploadFile, isUploading } = useDynamicStorage()

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (fileType.startsWith("audio/")) return <Music className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // Handle document upload
  const handleUpload = async () => {
    if (selectedFile && fileCategory) {
      const success = await uploadFile(selectedFile, fileCategory)
      if (success) {
        setSelectedFile(null)
        setFileCategory("")
        onOpenChange(false)
        onUploadSuccess?.()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Arquivo</DialogTitle>
          <DialogDescription>
            Envie documentos, imagens, vídeos ou áudios para sua base de
            conhecimento pessoal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <FileUp className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                📄 Documentos • 🖼️ Imagens • 🎥 Vídeos • 🎵 Áudios
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Limite: 50MB por arquivo
              </p>
            </label>
          </div>

          {selectedFile && (
            <Alert>
              {getFileIcon(selectedFile.type)}
              <AlertTitle>Arquivo selecionado</AlertTitle>
              <AlertDescription>
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-1"
            >
              Categoria
            </label>
            <Input
              id="category"
              placeholder="ex: Procedimentos, Financeiro, Saúde..."
              value={fileCategory}
              onChange={(e) => setFileCategory(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !fileCategory || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddDocumentDialog
