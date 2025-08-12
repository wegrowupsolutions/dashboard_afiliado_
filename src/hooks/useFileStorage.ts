import { useState, useEffect } from "react"

export interface StorageUsage {
  totalFiles: number
  totalSize: number
}

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "documento_importante.pdf",
    size: 1024 * 500, // 500 KB
    type: "application/pdf",
    url: "/path/to/documento_importante.pdf",
    uploaded_at: "2023-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "imagem_produto.jpg",
    size: 1024 * 1024 * 2, // 2 MB
    type: "image/jpeg",
    url: "/path/to/imagem_produto.jpg",
    uploaded_at: "2023-02-20T14:30:00Z",
  },
  {
    id: "3",
    name: "video_tutorial.mp4",
    size: 1024 * 1024 * 15, // 15 MB
    type: "video/mp4",
    url: "/path/to/video_tutorial.mp4",
    uploaded_at: "2023-03-01T09:15:00Z",
  },
]

const calculateMockStorageUsage = (files: FileItem[]): StorageUsage => {
  const totalFiles = files.length
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  return { totalFiles, totalSize }
}

export const useFileStorage = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
  const [storageUsage, setStorageUsage] = useState<StorageUsage>(
    calculateMockStorageUsage(mockFiles)
  )
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  const refetchFiles = () => {
    setIsLoadingFiles(true)
    // Simulate API call
    setTimeout(() => {
      setFiles(mockFiles) // In a real app, this would fetch from backend
      setStorageUsage(calculateMockStorageUsage(mockFiles))
      setIsLoadingFiles(false)
    }, 500)
  }

  const formatFileSize = (bytes: number, decimalPoint: number = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimalPoint < 0 ? 0 : decimalPoint
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  useEffect(() => {
    refetchFiles()
  }, [])

  return { files, storageUsage, isLoadingFiles, refetchFiles, formatFileSize }
}
