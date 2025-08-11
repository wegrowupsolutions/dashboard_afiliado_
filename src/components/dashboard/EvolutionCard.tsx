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
import { Link } from "lucide-react"

const EvolutionCard = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/evolution")
  }

  return (
    <Card
      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      onClick={handleClick}
    >
      <CardHeader
        className="pb-2 text-white rounded-t-lg"
        style={{ background: "linear-gradient(to right, #128940, #0F7535)" }}
      >
        <CardTitle className="flex items-center gap-2">
          <Link className="h-6 w-6" />
          Evolution
        </CardTitle>
        <CardDescription style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          Conectar e sincronizar
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-center">
          <div
            className="p-6 rounded-full"
            style={{ backgroundColor: "rgba(18, 137, 64, 0.1)" }}
          >
            <Link className="h-14 w-14" style={{ color: "#128940" }} />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Conecte e sincronize seu sistema com a plataforma Evolution.
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t dark:border-gray-700 flex justify-center py-3">
        <Badge
          variant="outline"
                     style={{
             backgroundColor: "rgba(74, 222, 128, 0.25)",
             color: "#4ADE80",
             border: "1px solid rgba(74, 222, 128, 0.7)",
             fontWeight: "700",
             textShadow: "0 0 12px rgba(74, 222, 128, 0.4)",
           }}
          className="hover:opacity-80"
        >
          Conectar Evolution
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default EvolutionCard
