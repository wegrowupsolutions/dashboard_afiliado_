import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, ArrowRight, User, Phone, Bot, Eye, EyeOff, Zap, Cpu, Brain, Shield, Network, Moon } from "lucide-react"
import SignupForm from "@/components/SignupForm"

const Index = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const result = await signIn(email, password)
        if (result.success) {
          toast({
            title: "Sucesso!",
            description: "Login realizado com sucesso.",
          })
          navigate("/dashboard")
        } else {
          toast({
            title: "Erro",
            description: result.error || "Credenciais inválidas.",
            variant: "destructive",
          })
        }
      } else {
        const result = await signUp(email, password, name)
        if (result.success) {
          toast({
            title: "Sucesso!",
            description: "Conta criada com sucesso. Verifique seu email.",
          })
          setIsLogin(true)
        } else {
          toast({
            title: "Erro",
            description: result.error || "Ocorreu um erro. Tente novamente.",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <SignupForm onSuccess={() => setIsLogin(true)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
      
      {/* Floating Tech Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <Zap className="absolute top-20 left-20 text-cyan-400/30 animate-pulse" size={40} />
        <Cpu className="absolute top-40 right-32 text-green-400/30 animate-pulse delay-1000" size={35} />
        <Brain className="absolute bottom-32 left-32 text-blue-400/30 animate-pulse delay-2000" size={45} />
        <Shield className="absolute bottom-40 right-20 text-purple-400/30 animate-pulse delay-1500" size={38} />
        <Network className="absolute top-1/2 left-1/4 text-yellow-400/30 animate-pulse delay-500" size={42} />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
          <Moon className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Afiliado IA
                </h1>
                <p className="text-sm text-gray-300">
                  Sistema Inteligente de Automação
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-300"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 transition-all duration-300"
                    placeholder="Senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto"></div>
                ) : (
                  <>
                    <Bot className="w-5 h-5 mr-2" />
                    Acesso ao Sistema
                  </>
                )}
              </Button>
            </form>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index

