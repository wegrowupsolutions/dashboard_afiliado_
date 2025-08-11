import React from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"

const ConfigCard = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/config")
  }

  return (
    <Card
      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={handleClick}
    >
      <CardHeader
        className="pb-2 text-white rounded-t-lg"
        style={{ background: "linear-gradient(to right, #F59E0B, #D97706)" }}
      >
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuração
        </CardTitle>
        <CardDescription style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          Configurações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div
            className="p-6 rounded-full"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
          >
            <Settings className="h-14 w-14" style={{ color: "#F59E0B" }} />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Gerencie configurações gerais e preferências do sistema.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
          style={{
            backgroundColor: "rgba(251, 191, 36, 0.25)",
            color: "#FBBF24",
            border: "1px solid rgba(251, 191, 36, 0.7)",
            fontWeight: "700",
            textShadow: "0 0 12px rgba(251, 191, 36, 0.4)",
          }}
          className="hover:opacity-80"
        >
          Acessar configurações
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default ConfigCard
