import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  bucket: string
  created_at: string
}

export const useDynamicStorage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Obter o nome do bucket do usuário
  const getUserBucketName = async (): Promise<string | null> => {
    if (!user?.cliente_id && !user?.id) return null

    try {
      const userId = user.cliente_id || user.id
      const { data, error } = await supabase
        .from("cliente_config")
        .select("bucket_name")
        .eq("cliente_id", userId)
        .single()

      if (error) {
        console.error("Erro ao buscar bucket do usuário:", error)
        return null
      }

      // Se não tiver bucket_name configurado, tentar gerar baseado no email do usuário
      if (!data?.bucket_name && user?.email) {
        const emailBasedBucket = generateEmailBasedBucketName(user.email)
        console.log(`📦 Tentando bucket baseado no email: ${emailBasedBucket}`)
        return emailBasedBucket
      }

      return data?.bucket_name || null
    } catch (error) {
      console.error("Erro inesperado ao buscar bucket:", error)
      return null
    }
  }

  // Gerar nome do bucket baseado no email
  const generateEmailBasedBucketName = (email: string): string => {
    // Transformar email no padrão: user-email-formato
    const sanitizedEmail = email
      .toLowerCase()
      .replace(/[@.]/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")

    return `user-${sanitizedEmail}`
  }

  // Upload de arquivo para o bucket do usuário
  const uploadFile = async (
    file: File,
    category: string = "general"
  ): Promise<boolean> => {
    if (!user?.cliente_id && !user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não está logado.",
        variant: "destructive",
      })
      return false
    }

    setIsUploading(true)

    try {
      console.log("🔍 Buscando bucket do usuário...")
      const bucketName = await getUserBucketName()

      if (!bucketName) {
        toast({
          title: "Erro de configuração",
          description: "Bucket do usuário não encontrado.",
          variant: "destructive",
        })
        return false
      }

      console.log(`📦 Usando bucket: ${bucketName}`)

      // Usar o nome original do arquivo na raiz do bucket
      const fileName = file.name

      console.log(`📤 Fazendo upload: ${fileName}`)

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Erro no upload:", error)
        toast({
          title: "Erro no upload",
          description: error.message,
          variant: "destructive",
        })
        return false
      }

      console.log("✅ Upload realizado com sucesso:", data)

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      // Adicionar à lista de arquivos
      const newFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        bucket: bucketName,
        created_at: new Date().toISOString(),
      }

      setFiles((prev) => [newFile, ...prev])

      toast({
        title: "Upload realizado!",
        description: `${file.name} foi enviado com sucesso.`,
      })

      return true
    } catch (error) {
      console.error("Erro inesperado no upload:", error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível fazer o upload do arquivo.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsUploading(false)
    }
  }

  // Listar arquivos do bucket do usuário
  const listFiles = async () => {
    if (!user?.cliente_id && !user?.id) return

    setIsLoadingFiles(true)

    try {
      const bucketName = await getUserBucketName()

      if (!bucketName) {
        console.log("Bucket não encontrado para o usuário")
        setFiles([])
        return
      }

      console.log(`📋 Listando arquivos do bucket: ${bucketName}`)

      const { data, error } = await supabase.storage.from(bucketName).list("", {
        limit: 100,
        offset: 0,
      })

      if (error) {
        console.error("Erro ao listar arquivos:", error)
        return
      }

      // Converter para formato UploadedFile
      const fileList: UploadedFile[] =
        data?.map((item) => {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(item.name)

          return {
            id: item.name,
            name: item.name,
            size: item.metadata?.size || 0,
            type: item.metadata?.mimetype || "unknown",
            url: urlData.publicUrl,
            bucket: bucketName,
            created_at: item.created_at,
          }
        }) || []

      setFiles(fileList)
      console.log(`✅ ${fileList.length} arquivos encontrados`)
    } catch (error) {
      console.error("Erro inesperado ao listar arquivos:", error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Deletar arquivo
  const deleteFile = async (fileName: string): Promise<boolean> => {
    try {
      console.log(`🗑️ Iniciando deleção do arquivo: ${fileName}`)

      const bucketName = await getUserBucketName()
      console.log(`💼 Bucket encontrado: ${bucketName}`)

      if (!bucketName) {
        console.error("❌ Bucket não encontrado")
        toast({
          title: "Erro",
          description: "Bucket não encontrado.",
          variant: "destructive",
        })
        return false
      }

      console.log(`📄 Tentando remover de ${bucketName}: [${fileName}]`)

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName])

      if (error) {
        console.error("❌ Erro ao deletar arquivo:", error)
        toast({
          title: "Erro ao deletar",
          description: error.message,
          variant: "destructive",
        })
        return false
      }

      console.log("✅ Arquivo removido do storage com sucesso!")

      // Remover da lista local
      setFiles((prev) => prev.filter((file) => file.id !== fileName))
      console.log("✅ Arquivo removido da lista local")

      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido com sucesso.",
      })

      return true
    } catch (error) {
      console.error("❌ Erro inesperado ao deletar:", error)
      return false
    }
  }

  return {
    uploadFile,
    listFiles,
    deleteFile,
    files,
    isUploading,
    isLoadingFiles,
    getUserBucketName,
  }
}
