
import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PauseDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string, duration?: number) => void
  conversationName: string
}

export function PauseDurationDialog({
  open,
  onOpenChange,
  onConfirm,
  conversationName,
}: PauseDurationDialogProps) {
  const [reason, setReason] = useState("")
  const [duration, setDuration] = useState("")
  const [durationUnit, setDurationUnit] = useState("minutes")

  const handleConfirm = () => {
    if (!reason.trim()) return

    let durationInSeconds: number | undefined
    
    if (duration && durationUnit) {
      const durationValue = parseInt(duration)
      if (!isNaN(durationValue) && durationValue > 0) {
        switch (durationUnit) {
          case "seconds":
            durationInSeconds = durationValue
            break
          case "minutes":
            durationInSeconds = durationValue * 60
            break
          case "hours":
            durationInSeconds = durationValue * 60 * 60
            break
          case "days":
            durationInSeconds = durationValue * 24 * 60 * 60
            break
        }
      }
    }

    onConfirm(reason.trim(), durationInSeconds)
    
    // Reset form
    setReason("")
    setDuration("")
    setDurationUnit("minutes")
  }

  const handleCancel = () => {
    setReason("")
    setDuration("")
    setDurationUnit("minutes")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pausar Conversa</DialogTitle>
          <DialogDescription>
            Pausar a conversa com {conversationName} para assumir o controle manualmente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo da pausa *</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Cliente solicitou atendimento humano, vou assumir a conversa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="duration">Duração da pausa (opcional)</Label>
            <div className="flex space-x-2">
              <Input
                id="duration"
                type="number"
                placeholder="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="flex-1"
              />
              <Select value={durationUnit} onValueChange={setDurationUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Segundos</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para pausar indefinidamente
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Pausar Conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
