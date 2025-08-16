
import React from 'react';
import { 
  FileText, 
  Trash2, 
  Video, 
  Music, 
  Image, 
  Table, 
  FileVideo, 
  FileAudio, 
  FileImage, 
  FileSpreadsheet, 
  FileText as FileTextIcon 
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
  titulo?: string | null;
  metadata?: Record<string, any> | null;
}

interface DocumentCardProps {
  document: Document;
  onDelete: (id: number, title: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  // Função para determinar o ícone baseado no tipo de arquivo
  const getFileIcon = (fileName: string, fileType: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    
    // Por extensão do arquivo (mais confiável)
    if (['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <FileVideo className="h-5 w-5 mr-2 text-red-500" />
    }
    
    if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma'].includes(extension || '')) {
      return <FileAudio className="h-5 w-5 mr-2 text-green-500" />
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'].includes(extension || '')) {
      return <FileImage className="h-5 w-5 mr-2 text-blue-500" />
    }
    
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <FileSpreadsheet className="h-5 w-5 mr-2 text-emerald-500" />
    }
    
    if (['doc', 'docx', 'rtf', 'pdf', 'txt'].includes(extension || '')) {
      return <FileTextIcon className="h-5 w-5 mr-2 text-amber-500" />
    }
    
    // Por tipo MIME
    if (fileType.startsWith('video/')) {
      return <FileVideo className="h-5 w-5 mr-2 text-red-500" />
    }
    
    if (fileType.startsWith('audio/')) {
      return <FileAudio className="h-5 w-5 mr-2 text-green-500" />
    }
    
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 mr-2 text-blue-500" />
    }
    
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-5 w-5 mr-2 text-emerald-500" />
    }
    
    if (fileType.includes('word') || fileType.includes('document') || fileType === 'application/pdf') {
      return <FileTextIcon className="h-5 w-5 mr-2 text-amber-500" />
    }
    
    // Padrão
    return <FileText className="h-5 w-5 mr-2 text-gray-500" />
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {getFileIcon(document.name, document.type)}
          <span className="truncate">{document.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <div>Adicionado: {document.uploadedAt}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {document.type || 'Arquivo'}
            </span>
            {document.size && (
              <span className="text-xs text-gray-400">
                {document.size}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Documento</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja excluir o documento?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancelar</Button>
              <Button 
                variant="destructive" 
                onClick={() => onDelete(document.id, document.titulo || document.name)}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
