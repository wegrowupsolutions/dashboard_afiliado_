import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter } from "lucide-react"

interface Service {
  name: string
  value: number
}

interface ServicesBarChartProps {
  data: Service[]
}

const ServicesBarChart: React.FC<ServicesBarChartProps> = ({ data }) => {
  // Funnel data with proper widths for each segment
  const funnelData = data.map((item, index) => ({
    ...item,
    width: 90 - index * 12, // Start wider and get progressively narrower
  }))

  const colors = ["#10B981", "#059669", "#047857", "#065F46"] // Green gradient shades

  return (
    <Card className="dark:bg-gray-800 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
          <Filter className="h-5 w-5 text-green-600 dark:text-green-400" />
          Funil de Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex flex-col justify-center items-center">
          <div className="relative">
            {funnelData.map((item, index) => (
              <div key={item.name} className="relative group mb-1">
                {/* Funnel segment */}
                <div
                  className="relative mx-auto transition-all duration-300 hover:scale-105"
                  style={{
                    width: `${item.width * 3}px`, // Convert to fixed pixels for better control
                    height: "60px",
                    background: colors[index],
                    clipPath: "polygon(10% 0%, 90% 0%, 85% 100%, 15% 100%)", // Trapezoid shape
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  {/* Content inside funnel segment */}
                  <div className="text-center text-white font-semibold">
                    <div className="text-base font-medium">{item.name}</div>
                    <div className="text-lg font-bold">{item.value}</div>
                  </div>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {item.value} leads (
                  {(
                    (item.value / data.reduce((sum, d) => sum + d.value, 0)) *
                    100
                  ).toFixed(1)}
                  %)
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center">
              <div className="text-xs opacity-75">Total</div>
              <div className="font-semibold text-gray-800 dark:text-white">
                {data.reduce((sum, item) => sum + item.value, 0)} leads
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServicesBarChart
