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
import { Users } from "lucide-react"

const ClientsCard = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/clients")
  }

  return (
    <Card
      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={handleClick}
    >
      <CardHeader
        className="pb-2 text-white rounded-t-lg"
        style={{ background: "linear-gradient(to right, #8427D7, #7621C2)" }}
      >
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Leads
        </CardTitle>
        <CardDescription style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          CRM e gerenciamento
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div
            className="p-6 rounded-full"
            style={{ backgroundColor: "rgba(132, 39, 215, 0.1)" }}
          >
            <Users className="h-14 w-14" style={{ color: "#8427D7" }} />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Gerencie seus clientes, histórico e relacionamentos.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
          style={{
            backgroundColor: "rgba(196, 144, 255, 0.25)",
            color: "#C490FF",
            border: "1px solid rgba(196, 144, 255, 0.7)",
            fontWeight: "700",
            textShadow: "0 0 12px rgba(196, 144, 255, 0.4)",
          }}
          className="hover:opacity-80"
        >
          Acessar CRM de Leads
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default ClientsCard
