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
  folder?: string
}

export const useDynamicStorage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Obter o nome do bucket do usuário
  const getUserBucketName = async (): Promise<string | null> => {
    if (!user?.id) return null

    try {
      // Primeiro tentar buscar na tabela dados_cliente
      const { data: dadosCliente, error: dadosError } = await supabase
        .from("dados_cliente")
        .select("bucket_name")
        .eq("id", user.id)
        .single()

      if (dadosError && dadosError.code !== "PGRST116") {
        console.error("Erro ao buscar bucket em dados_cliente:", dadosError)
      }

      // Se encontrou bucket_name em dados_cliente, usar
      if (dadosCliente?.bucket_name) {
        console.log(`📦 Bucket encontrado em dados_cliente: ${dadosCliente.bucket_name}`)
        return dadosCliente.bucket_name
      }

      // Se não encontrou, tentar em cliente_config (fallback)
      const { data: clienteConfig, error: configError } = await supabase
        .from("cliente_config")
        .select("bucket_name")
        .eq("cliente_id", user.id)
        .single()

      if (configError && configError.code !== "PGRST116") {
        console.error("Erro ao buscar bucket em cliente_config:", configError)
      }

      if (clienteConfig?.bucket_name) {
        console.log(`📦 Bucket encontrado em cliente_config: ${clienteConfig.bucket_name}`)
        return clienteConfig.bucket_name
      }

      // Se não tiver bucket_name configurado, gerar baseado no email do usuário
      if (user?.email) {
        const emailBasedBucket = generateEmailBasedBucketName(user.email)
        console.log(`📦 Gerando bucket baseado no email: ${emailBasedBucket}`)
        
        // Tentar criar o bucket se não existir
        await createBucketIfNotExists(emailBasedBucket)
        
        return emailBasedBucket
      }

      return null
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

  // Criar bucket se não existir
  const createBucketIfNotExists = async (bucketName: string): Promise<boolean> => {
    try {
      console.log(`🔧 Verificando se bucket ${bucketName} existe...`)
      
      // Tentar listar arquivos para ver se o bucket existe
      const { data, error } = await supabase.storage.from(bucketName).list("", {
        limit: 1,
        offset: 0,
      })

      if (error) {
        // Se o erro for "bucket not found", criar o bucket
        if (error.message.includes("not found") || error.message.includes("does not exist")) {
          console.log(`📦 Bucket ${bucketName} não existe, criando...`)
          
          // Criar o bucket
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: false, // Bucket privado por padrão
            allowedMimeTypes: [
              'image/*',
              'video/*', 
              'audio/*',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain'
            ],
            fileSizeLimit: 52428800 // 50MB
          })

          if (createError) {
            console.error("❌ Erro ao criar bucket:", createError)
            return false
          }

          console.log(`✅ Bucket ${bucketName} criado com sucesso!`)
          
          // Criar estrutura de pastas automaticamente
          await createFolderStructure(bucketName)
          
          // Criar políticas de segurança automaticamente
          await createBucketPolicies(bucketName)
          
          // Salvar o nome do bucket na tabela dados_cliente
          if (user?.id) {
            const { error: updateError } = await supabase
              .from("dados_cliente")
              .update({ bucket_name: bucketName })
              .eq("id", user.id)

            if (updateError) {
              console.warn("⚠️ Não foi possível salvar bucket_name na tabela:", updateError)
            } else {
              console.log("✅ bucket_name salvo na tabela dados_cliente")
            }
          }
          
          return true
        } else {
          console.error("❌ Erro ao verificar bucket:", error)
          return false
        }
      }

      console.log(`✅ Bucket ${bucketName} já existe`)
      
      // Verificar se as pastas existem, se não, criar
      await createFolderStructure(bucketName)
      
      return true
    } catch (error) {
      console.error("❌ Erro inesperado ao verificar/criar bucket:", error)
      return false
    }
  }

  // Criar estrutura de pastas organizadas
  const createFolderStructure = async (bucketName: string): Promise<void> => {
    try {
      console.log(`📁 Criando estrutura de pastas para bucket ${bucketName}...`)
      
      // Estrutura de pastas padrão
      const folders = [
        'documentos/',
        'documentos/videos/',
        'documentos/audios/',
        'documentos/tabelas/',
        'documentos/textos/',
        'documentos/imagens/'
      ]
      
      // As pastas são criadas automaticamente pelo Supabase quando o primeiro arquivo é enviado
      // Não precisamos criar arquivos .folder desnecessários
      console.log(`✅ Estrutura de pastas preparada para bucket ${bucketName}`)
      console.log(`📁 As pastas serão criadas automaticamente quando arquivos forem enviados`)
    } catch (error) {
      console.error("❌ Erro ao criar estrutura de pastas:", error)
    }
  }

  // Criar políticas de segurança para o bucket
  const createBucketPolicies = async (bucketName: string): Promise<void> => {
    try {
      console.log(`🔒 Criando políticas de segurança para bucket ${bucketName}...`)
      
      // Nota: As políticas são criadas via SQL, não via JavaScript
      // Aqui apenas logamos que o bucket está pronto para políticas
      console.log(`✅ Bucket ${bucketName} criado e pronto para políticas de segurança`)
      console.log(`📋 Configure as políticas no Supabase Dashboard > Storage > Policies`)
      console.log(`🎯 Bucket: ${bucketName}`)
      
    } catch (error) {
      console.error("❌ Erro ao configurar políticas:", error)
    }
  }

  // Upload de arquivo para o bucket do usuário
  const uploadFile = async (
    file: File,
    category: string = "general"
  ): Promise<boolean> => {
    if (!user?.id) {
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

      // Garantir que o bucket existe antes do upload
      const bucketExists = await createBucketIfNotExists(bucketName)
      if (!bucketExists) {
        toast({
          title: "Erro de configuração",
          description: "Não foi possível criar o bucket de armazenamento.",
          variant: "destructive",
        })
        return false
      }

      // Determinar pasta baseada no tipo de arquivo
      const targetFolder = getTargetFolder(file.type, file.name)
      const filePath = `${targetFolder}${file.name}`

      console.log(`📤 Fazendo upload: ${file.name} → ${targetFolder}`)

      // Upload para o Supabase Storage na pasta correta
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
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
        .getPublicUrl(filePath)

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
        description: `${file.name} foi enviado para ${targetFolder}`,
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

  // Determinar pasta baseada no tipo de arquivo
  const getTargetFolder = (mimeType: string, fileName: string): string => {
    // Por extensão do arquivo (mais confiável)
    const extension = fileName.toLowerCase().split('.').pop()
    
    // Por tipo MIME
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'documentos/videos/'
    }
    
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma'].includes(extension || '')) {
      return 'documentos/audios/'
    }
    
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'].includes(extension || '')) {
      return 'documentos/imagens/'
    }
    
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'documentos/tabelas/'
    }
    
    if (mimeType.includes('word') || mimeType.includes('document') || ['doc', 'docx', 'rtf'].includes(extension || '')) {
      return 'documentos/textos/'
    }
    
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'documentos/textos/'
    }
    
    if (mimeType === 'text/plain' || extension === 'txt') {
      return 'documentos/textos/'
    }
    
    // Padrão para outros tipos
    return 'documentos/'
  }

  // Listar arquivos do bucket do usuário
  const listFiles = async () => {
    if (!user?.id) return

    setIsLoadingFiles(true)

    try {
      const bucketName = await getUserBucketName()

      if (!bucketName) {
        console.log("Bucket não encontrado para o usuário")
        setFiles([])
        return
      }

      // Garantir que o bucket existe antes de listar
      const bucketExists = await createBucketIfNotExists(bucketName)
      if (!bucketExists) {
        console.log("❌ Bucket não pôde ser criado")
        setFiles([])
        return
      }

      console.log(`📋 Listando arquivos do bucket: ${bucketName}`)

      // Listar arquivos de todas as pastas
      const allFiles: UploadedFile[] = []
      
      // Pastas para listar
      const folders = [
        'documentos/',
        'documentos/videos/',
        'documentos/audios/',
        'documentos/tabelas/',
        'documentos/textos/',
        'documentos/imagens/'
      ]
      
      for (const folder of folders) {
        try {
          const { data, error } = await supabase.storage.from(bucketName).list(folder, {
            limit: 100,
            offset: 0,
          })

          if (error) {
            console.warn(`⚠️ Erro ao listar pasta ${folder}:`, error)
            continue
          }

          // Filtrar apenas arquivos reais (excluir arquivos .folder e pastas vazias)
          const realFiles = data?.filter(item => 
            !item.name.endsWith('.folder') && 
            item.metadata?.size > 0
          ) || []
          
          // Converter para formato UploadedFile
          const folderFileList: UploadedFile[] = realFiles.map((item) => {
            const filePath = `${folder}${item.name}`
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)

            return {
              id: filePath,
              name: item.name,
              size: item.metadata?.size || 0,
              type: item.metadata?.mimetype || "unknown",
              url: urlData.publicUrl,
              bucket: bucketName,
              created_at: item.created_at,
              folder: folder.replace('documentos/', '').replace('/', '') || 'geral'
            }
          })

          allFiles.push(...folderFileList)
        } catch (e) {
          console.warn(`⚠️ Erro ao processar pasta ${folder}:`, e)
        }
      }

      // Filtrar apenas arquivos com tamanho > 0 (arquivos reais)
      const realFilesOnly = allFiles.filter(file => file.size > 0)
      
      setFiles(realFilesOnly)
      console.log(`✅ ${realFilesOnly.length} arquivos reais encontrados`)
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

      // Garantir que o bucket existe antes de deletar
      const bucketExists = await createBucketIfNotExists(bucketName)
      if (!bucketExists) {
        console.error("❌ Bucket não pôde ser criado")
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
    createBucketIfNotExists,
  }
}
