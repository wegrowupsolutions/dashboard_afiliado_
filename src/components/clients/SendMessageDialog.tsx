import React from "react"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Contact } from '@/types/client'

interface SendMessageDialogProps {
  selectedContact: Contact
  messageText: string
  setMessageText: (text: string) => void
  handleMessageSubmit: () => void
  onOpenChange: (open: boolean) => void
}

const SendMessageDialog = ({
  selectedContact,
  messageText,
  setMessageText,
  handleMessageSubmit,
  onOpenChange,
}: SendMessageDialogProps) => {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Enviar Mensagem</DialogTitle>
        <DialogDescription>
          Envie uma mensagem para {selectedContact.name} via WhatsApp
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="message" className="text-right">
            Mensagem
          </Label>
          <Textarea
            id="message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="col-span-3"
            placeholder="Digite sua mensagem aqui..."
            rows={4}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleMessageSubmit}>
          Prosseguir
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export default SendMessageDialog