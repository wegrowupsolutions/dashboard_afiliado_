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
      // Buscar bucket_name APENAS na tabela dados_cliente
      const { data: dadosCliente, error: dadosError } = await supabase
        .from("dados_cliente")
        .select("bucket_name")
        .eq("id", user.id)
        .single()

      if (dadosError && dadosError.code !== "PGRST116") {
        console.error("Erro ao buscar bucket em dados_cliente:", dadosError)
        return null
      }

      // Se encontrou bucket_name em dados_cliente, usar
      if (dadosCliente?.bucket_name) {
        console.log(`📦 Bucket encontrado em dados_cliente: ${dadosCliente.bucket_name}`)
        return dadosCliente.bucket_name
      }

      // Se não encontrou bucket_name, gerar baseado no email do usuário
      if (user?.email) {
        const emailBasedBucket = generateEmailBasedBucketName(user.email)
        console.log(`📦 Gerando bucket baseado no email: ${emailBasedBucket}`)
        
        // Tentar criar o bucket se não existir
        await createBucketIfNotExists(emailBasedBucket)
        
        // Salvar o bucket_name na tabela dados_cliente para uso futuro
        try {
          const { error: updateError } = await supabase
            .from("dados_cliente")
            .upsert({
              id: user.id,
              bucket_name: emailBasedBucket,
              email: user.email || 'sem-email@exemplo.com'
            }, {
              onConflict: 'id'
            })

          if (updateError) {
            console.warn("⚠️ Não foi possível salvar bucket_name na tabela:", updateError)
          } else {
            console.log("✅ bucket_name salvo na tabela dados_cliente")
          }
        } catch (saveError) {
          console.warn("⚠️ Erro ao salvar bucket_name:", saveError)
        }
        
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

  // Função para limpar estrutura incorreta e criar a correta
  const cleanupAndCreateCorrectStructure = async (bucketName: string): Promise<void> => {
    try {
      console.log(`🧹 Limpando estrutura incorreta e criando a correta...`)
      
      // 1. Deletar a pasta 'imagens' incorreta (se existir)
      try {
        const { data: oldFiles } = await supabase.storage
          .from(bucketName)
          .list('imagens/imagens/')
        
        if (oldFiles && oldFiles.length > 0) {
          console.log(`🗑️ Deletando arquivos da pasta incorreta 'imagens/imagens/'...`)
          for (const file of oldFiles) {
            if (file.name !== '.folder') {
              await supabase.storage
                .from(bucketName)
                .remove([`imagens/imagens/${file.name}`])
            }
          }
        }
        
        // Deletar a pasta 'imagens' incorreta
        await supabase.storage
          .from(bucketName)
          .remove(['imagens/imagens/'])
        
        console.log(`✅ Pasta incorreta 'imagens/imagens/' removida`)
      } catch (error) {
        console.log(`ℹ️ Pasta 'imagens/imagens/' não existia ou já foi removida`)
      }
      
      // 2. Criar a estrutura correta: documentos/tipo/
      const correctFolders = [
        'documentos/',
        'documentos/imagens/',
        'documentos/videos/',
        'documentos/audios/',
        'documentos/tabelas/',
        'documentos/textos/'
      ]
      
      for (const folder of correctFolders) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(`${folder}.folder`, new Blob([''], { type: 'text/plain' }), {
              cacheControl: "3600",
              upsert: true,
            })
          
          if (error) {
            console.warn(`⚠️ Aviso ao criar pasta ${folder}:`, error)
          } else {
            console.log(`✅ Pasta ${folder} criada/verificada`)
          }
        } catch (folderError) {
          console.warn(`⚠️ Erro ao criar pasta ${folder}:`, folderError)
        }
      }
      
      console.log(`✅ Estrutura correta criada: documentos/tipo/`)
    } catch (error) {
      console.error("❌ Erro ao limpar e criar estrutura:", error)
    }
  }

  // Criar estrutura de pastas organizadas (agora usa a função de limpeza)
  const createFolderStructure = async (bucketName: string): Promise<void> => {
    await cleanupAndCreateCorrectStructure(bucketName)
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

  // Função para sanitizar nomes de arquivos (remover caracteres especiais)
  const sanitizeFileName = (fileName: string): string => {
    // Remover acentos e caracteres especiais
    const normalized = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    // Remover caracteres especiais e espaços, substituir por hífen
    const sanitized = normalized
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-') // Substituir múltiplos hífens por um só
      .replace(/^-|-$/g, '') // Remover hífens no início e fim
    
    // Garantir que o nome não fique vazio
    if (!sanitized) {
      return 'arquivo'
    }
    
    return sanitized
  }

  // Upload de arquivo para o bucket do usuário com retry automático
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

    // Função de retry com delay
    const uploadWithRetry = async (retryCount: number = 0): Promise<boolean> => {
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
        
        // Garantir que a pasta específica existe antes do upload
        await createFolderStructure(bucketName)
        
        // Sanitizar o nome do arquivo para evitar problemas
        const originalName = file.name
        const fileExtension = originalName.split('.').pop() || ''
        const fileNameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
        const sanitizedFileName = sanitizeFileName(fileNameWithoutExt)
        const finalFileName = `${sanitizedFileName}.${fileExtension}`
        
        // Construir o caminho correto: targetFolder já inclui 'documentos/tipo/'
        const filePath = `${targetFolder}${finalFileName}`

        console.log(`📤 Fazendo upload: ${originalName} → ${filePath}`)
        console.log(`📁 Pasta de destino: ${targetFolder}`)
        console.log(`🔤 Nome sanitizado: ${finalFileName}`)

        // Upload para o Supabase Storage na pasta correta
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (error) {
          console.error("Erro no upload:", error)
          console.error("Detalhes do erro:", JSON.stringify(error, null, 2))
          
          // Se for erro de SSL, tentar novamente
          if (error.message.includes('SSL') || error.message.includes('fetch') || error.message.includes('network')) {
            if (retryCount < 3) {
              console.log(`🔄 Tentativa ${retryCount + 1} falhou, tentando novamente em 2 segundos...`)
              await new Promise(resolve => setTimeout(resolve, 2000))
              return uploadWithRetry(retryCount + 1)
            }
          }
          
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
          name: originalName, // Manter o nome original para exibição
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          bucket: bucketName,
          created_at: new Date().toISOString(),
        }

        setFiles((prev) => [newFile, ...prev])

        toast({
          title: "Upload realizado!",
          description: `${originalName} foi enviado para ${targetFolder}`,
        })

        return true
      } catch (error) {
        console.error("Erro inesperado no upload:", error)
        
        // Se for erro de SSL, tentar novamente
        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (retryCount < 3) {
            console.log(`🔄 Tentativa ${retryCount + 1} falhou, tentando novamente em 2 segundos...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            return uploadWithRetry(retryCount + 1)
          }
        }
        
        toast({
          title: "Erro inesperado",
          description: "Não foi possível fazer o upload do arquivo.",
          variant: "destructive",
        })
        return false
      }
    }

    try {
      return await uploadWithRetry()
    } finally {
      setIsUploading(false)
    }
  }

  // Determinar pasta baseada no tipo de arquivo
  const getTargetFolder = (mimeType: string, fileName: string): string => {
    // Por extensão do arquivo (mais confiável)
    const extension = fileName.toLowerCase().split('.').pop()
    
    // Por tipo MIME - CORRIGIDO para usar a estrutura correta: documentos/tipo/
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
