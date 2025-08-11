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
import { LineChart } from "lucide-react"

const MetricsCard = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/metrics")
  }

  return (
    <Card
      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={handleClick}
    >
      <CardHeader
        className="pb-2 text-white rounded-t-lg"
        style={{ background: "linear-gradient(to right, #1D44BA, #1A3FA3)" }}
      >
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-6 w-6" />
          Métricas
        </CardTitle>
        <CardDescription style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          Estatísticas e indicadores
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div
            className="p-6 rounded-full relative"
            style={{ backgroundColor: "rgba(29, 68, 186, 0.1)" }}
          >
            <LineChart className="h-14 w-14" style={{ color: "#1D44BA" }} />
            <div
              className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
              style={{ backgroundColor: "#1D44BA" }}
            >
              110
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Análise de indicadores e métricas disponíveis.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
          style={{
            backgroundColor: "rgba(125, 211, 252, 0.25)",
            color: "#7DD3FC",
            border: "1px solid rgba(125, 211, 252, 0.7)",
            fontWeight: "700",
            textShadow: "0 0 12px rgba(125, 211, 252, 0.4)",
          }}
          className="hover:opacity-80"
        >
          Acessar dashboard de métricas
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default MetricsCard
