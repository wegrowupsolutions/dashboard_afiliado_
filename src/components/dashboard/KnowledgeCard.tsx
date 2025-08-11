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
import { Database } from "lucide-react"

const KnowledgeCard = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/knowledge")
  }

  return (
    <Card
      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={handleClick}
    >
      <CardHeader
        className="pb-2 text-white rounded-t-lg"
        style={{ background: "linear-gradient(to right, #B95708, #A04906)" }}
      >
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Arquivos
        </CardTitle>
        <CardDescription style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          Documentos e arquivos
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div
            className="p-6 rounded-full relative"
            style={{ backgroundColor: "rgba(185, 87, 8, 0.1)" }}
          >
            <Database className="h-14 w-14" style={{ color: "#B95708" }} />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Gerencie documentos e arquivos da base de conhecimento.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
                     style={{
             backgroundColor: "rgba(255, 206, 84, 0.25)",
             color: "#FFCE54",
             border: "1px solid rgba(255, 206, 84, 0.7)",
             fontWeight: "700",
             textShadow: "0 0 12px rgba(255, 206, 84, 0.4)",
           }}
          className="hover:opacity-80"
        >
          Acessar gerenciador
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default KnowledgeCard
