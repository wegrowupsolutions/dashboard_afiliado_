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
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Arquivos
        </CardTitle>
        <CardDescription className="text-cyan-100">
          Documentos e arquivos
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div className="bg-cyan-100 dark:bg-cyan-900/30 p-6 rounded-full relative">
            <Database className="h-14 w-14 text-cyan-500 dark:text-cyan-400" />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Gerencie documentos e arquivos da base de conhecimento.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
          className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-800/50"
        >
          Acessar gerenciador
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default KnowledgeCard
