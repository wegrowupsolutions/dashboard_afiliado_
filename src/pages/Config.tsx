import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  LogOut,
  MessageSquare,
  User,
  Target,
  Settings,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Link,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const Config = () => {
  const { user, signOut, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Mock hooks since they don't exist yet - we'll create simple state management
  const [formData, setFormData] = useState({
    specificScenario: "",
    problemToSolve: "",
    expectedResult: "",
    targetAudience: "",
    environment: "",
    toneOfVoice: "",
    languageLevel: "",
    personalityCharacteristics: "",
    specificKnowledge: "",
    importantPolicies: "",
    actionLimits: "",
    legalEthicalRestrictions: "",
    mandatoryProcedures: "",
    confidentialInformation: "",
    conversationStepByStep: "",
    frequentQuestions: "",
    practicalExamples: "",
    qualityIndicators: "",
    performanceMetrics: "",
    evaluationCriteria: "",
    promotionLinks: [{ url: "", isPrimary: true }],
  })

  const [expandedSections, setExpandedSections] = useState({
    context: false,
    personality: false,
    directives: false,
    structure: false,
    faq: false,
    examples: false,
    metrics: false,
    links: false,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingField, setMissingField] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const calculateProgress = () => {
    const totalFields = 21
    const filledFields = Object.values(formData).filter((value) => {
      if (Array.isArray(value)) {
        return (
          value.length > 0 &&
          value.some((item) =>
            typeof item === "object"
              ? Object.values(item).some((v) => v !== "")
              : item !== ""
          )
        )
      }
      return value.toString().trim() !== ""
    }).length

    return Math.round((filledFields / totalFields) * 100)
  }

  const getCompletedFieldsCount = () => {
    return Object.values(formData).filter((value) => {
      if (Array.isArray(value)) {
        return (
          value.length > 0 &&
          value.some((item) =>
            typeof item === "object"
              ? Object.values(item).some((v) => v !== "")
              : item !== ""
          )
        )
      }
      return value.toString().trim() !== ""
    }).length
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  // Check if user already has a saved prompt
  const checkExistingPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from("cliente_config")
        .select("id")
        .eq("cliente_id", user?.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - which is expected for new users
        console.error("Error checking existing prompt:", error)
        return false
      }

      return !!data // Returns true if data exists, false if not
    } catch (error) {
      console.error("Error checking existing prompt:", error)
      return false
    }
  }

  // Validate all required fields
  const validateRequiredFields = () => {
    const fieldLabels = {
      specificScenario: "Cenário Específico",
      problemToSolve: "Problema a Resolver",
      expectedResult: "Resultado Esperado",
      targetAudience: "Público-alvo",
      environment: "Ambiente",
      toneOfVoice: "Tom de Voz",
      languageLevel: "Nível de Linguagem",
      personalityCharacteristics: "Características da Personalidade",
      specificKnowledge: "Conhecimento Específico",
      importantPolicies: "Políticas Importantes",
      actionLimits: "Limites de Ação",
      legalEthicalRestrictions: "Restrições Legais e Éticas",
      mandatoryProcedures: "Procedimentos Obrigatórios",
      confidentialInformation: "Informações Confidenciais",
      conversationStepByStep: "Estrutura da Conversa",
      frequentQuestions: "Perguntas Frequentes",
      practicalExamples: "Exemplos Práticos",
      qualityIndicators: "Indicadores de Qualidade",
      performanceMetrics: "Métricas de Performance",
      evaluationCriteria: "Critérios de Avaliação",
    }

    // Check each required field
    for (const [key, label] of Object.entries(fieldLabels)) {
      const value = formData[key as keyof typeof formData]

      if (typeof value === "string" && value.trim() === "") {
        return { isValid: false, missingField: label }
      }
    }

    // Check promotion links (at least one with URL and description)
    if (!formData.promotionLinks || formData.promotionLinks.length === 0) {
      return { isValid: false, missingField: "Links de Promoção" }
    }

    const hasValidLink = formData.promotionLinks.some(
      (link) => link.url && link.url.trim() !== ""
    )

    if (!hasValidLink) {
      return {
        isValid: false,
        missingField: "Links de Promoção (URL)",
      }
    }

    return { isValid: true, missingField: "" }
  }

  // Link management functions
  const addNewLink = () => {
    setFormData((prev) => ({
      ...prev,
      promotionLinks: [...prev.promotionLinks, { url: "", isPrimary: false }],
    }))
  }

  const updateLink = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      promotionLinks: prev.promotionLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }))
  }

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      promotionLinks: prev.promotionLinks.filter((_, i) => i !== index),
    }))
  }

  // Function to convert formData to structured prompt
  const convertToPrompt = (data: typeof formData) => {
    return `# Prompt de Agente SDR com Técnica COT (Chain of Thought)

## Contexto
${data.specificScenario || "Descreva o cenário específico aqui"}

Problema a resolver: ${data.problemToSolve || "Descreva o problema aqui"}
Resultado esperado: ${
      data.expectedResult || "Descreva o resultado esperado aqui"
    }
Público-alvo: ${data.targetAudience || "Descreva o público-alvo aqui"}
Ambiente: ${data.environment || "Descreva o ambiente aqui"}

## Personalidade
- Tom de voz: ${data.toneOfVoice || "Defina o tom de voz aqui"}
- Nível de linguagem: ${
      data.languageLevel || "Defina o nível de linguagem aqui"
    }
- Características da personalidade: ${
      data.personalityCharacteristics || "Descreva as características aqui"
    }

## Diretrizes
${
  data.specificKnowledge
    ? `### Conhecimento Específico
${data.specificKnowledge}`
    : ""
}

${
  data.importantPolicies
    ? `### Políticas Importantes
${data.importantPolicies}`
    : ""
}

${
  data.actionLimits
    ? `### Limites de Ação
${data.actionLimits}`
    : ""
}

${
  data.legalEthicalRestrictions
    ? `### Restrições Legais e Éticas
${data.legalEthicalRestrictions}`
    : ""
}

${
  data.mandatoryProcedures
    ? `### Procedimentos Obrigatórios
${data.mandatoryProcedures}`
    : ""
}

## Estrutura da Conversa
${data.conversationStepByStep || "Defina a estrutura da conversa aqui"}

## FAQ - Perguntas Frequentes
${data.frequentQuestions || "Adicione perguntas frequentes aqui"}

## Exemplos de Uso
${data.practicalExamples || "Adicione exemplos de uso aqui"}

## Métricas de Sucesso
${data.qualityIndicators || "Defina indicadores de qualidade aqui"}

${
  data.performanceMetrics
    ? `### Métricas de Performance
${data.performanceMetrics}`
    : ""
}

${
  data.evaluationCriteria
    ? `### Critérios de Avaliação
${data.evaluationCriteria}`
    : ""
}

## Links de Promoção
${
  data.promotionLinks &&
  Array.isArray(data.promotionLinks) &&
  data.promotionLinks.length > 0
    ? data.promotionLinks
        .filter((link) => link && typeof link === "object")
        .map(
          (link, index) => `
### ${index + 1}. Link ${index + 1}
**URL:** ${(link && link.url) || "URL não definida"}
**Tipo:** ${link && link.isPrimary ? "Principal" : "Secundário"}
`
        )
        .join("")
    : "Adicione links promocionais aqui"
}

---
*Prompt gerado automaticamente pelo sistema Afiliado AI*
*Data de criação: ${new Date().toLocaleString("pt-BR")}*`
  }

  // Save configuration handler
  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      // Validate all required fields first
      const validation = validateRequiredFields()
      if (!validation.isValid) {
        setMissingField(validation.missingField)
        setShowValidationModal(true)
        setIsSaving(false)
        return
      }

      // Check if user already has a prompt saved
      const hasExistingPrompt = await checkExistingPrompt()

      if (hasExistingPrompt) {
        setShowLimitModal(true)
        setIsSaving(false)
        return
      }

      // Convert formData to structured prompt format
      const promptString = convertToPrompt(formData)

      // Save to cliente_config table in prompt field
      const { error } = await supabase.from("cliente_config").upsert({
        cliente_id: user?.id,
        prompt: promptString,
      })

      if (error) {
        throw error
      }

      console.log("Configuration saved successfully")
      // Show success message
    } catch (error) {
      console.error("Error saving configuration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel handler
  const handleCancel = () => {
    // Reset to empty form
    setFormData({
      specificScenario: "",
      problemToSolve: "",
      expectedResult: "",
      targetAudience: "",
      environment: "",
      toneOfVoice: "",
      languageLevel: "",
      personalityCharacteristics: "",
      specificKnowledge: "",
      importantPolicies: "",
      actionLimits: "",
      legalEthicalRestrictions: "",
      mandatoryProcedures: "",
      confidentialInformation: "",
      conversationStepByStep: "",
      frequentQuestions: "",
      practicalExamples: "",
      qualityIndicators: "",
      performanceMetrics: "",
      evaluationCriteria: "",
      promotionLinks: [{ url: "", isPrimary: true }],
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <div className="h-16 w-16 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-[#1F2937] text-white shadow-md transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDashboard}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Bot className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold">Afiliado AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-0 px-3 py-1"
            >
              Bem-vindo, {user?.user_metadata?.name || user?.email}
            </Badge>
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={signOut}
              className="border-white text-white bg-gray-950/50 hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Progresso da Configuração
                </h2>
                <p className="text-slate-400 text-sm">
                  Complete todas as seções para otimizar seu agente
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  {calculateProgress()}%
                </div>
                <div className="text-slate-400 text-sm">
                  {getCompletedFieldsCount()} de 21 campos
                </div>
              </div>
            </div>
            <Progress
              value={calculateProgress()}
              className="h-2 bg-slate-700 [&>[role=progressbar]]:bg-green-500"
            />
          </CardContent>
        </Card>

        {/* Configuration Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Context Card */}
          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
            onClick={() => toggleSection("context")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Contexto</h3>
                  <p className="text-slate-400 text-sm">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personality Card */}
          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
            onClick={() => toggleSection("personality")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Personalidade</h3>
                  <p className="text-slate-400 text-sm">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directives Card */}
          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
            onClick={() => toggleSection("directives")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Diretrizes</h3>
                  <p className="text-slate-400 text-sm">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Structure Card */}
          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
            onClick={() => toggleSection("structure")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Settings className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">
                    Estrutura da Conversa
                  </h3>
                  <p className="text-slate-400 text-sm">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Context Section */}
        <Collapsible
          open={expandedSections.context}
          onOpenChange={() => toggleSection("context")}
        >
          <Card className="mb-4 bg-slate-800 border-slate-700">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Contexto</CardTitle>
                      <CardDescription className="text-slate-400">
                        Defina o cenário e objetivo do agente
                      </CardDescription>
                    </div>
                  </div>
                  {expandedSections.context ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cenário Específico
                  </label>
                  <p className="text-slate-400 text-sm mb-3">
                    Descreva aqui o cenário específico onde o agente será
                    utilizado...
                  </p>
                  <Textarea
                    placeholder="Ex: Atendimento ao cliente para e-commerce de eletrônicos..."
                    value={formData.specificScenario}
                    onChange={(e) =>
                      handleInputChange("specificScenario", e.target.value)
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Problema a ser Resolvido
                  </label>
                  <p className="text-slate-400 text-sm mb-3">
                    Qual é o problema que precisa ser resolvido?
                  </p>
                  <Textarea
                    placeholder="Ex: Reduzir tempo de resposta e melhorar satisfação do cliente..."
                    value={formData.problemToSolve}
                    onChange={(e) =>
                      handleInputChange("problemToSolve", e.target.value)
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Resultado Esperado
                    </label>
                    <p className="text-slate-400 text-sm mb-3">
                      Qual é o resultado esperado?
                    </p>
                    <Textarea
                      placeholder="Ex: Aumentar conversões em 20%..."
                      value={formData.expectedResult}
                      onChange={(e) =>
                        handleInputChange("expectedResult", e.target.value)
                      }
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Público-Alvo
                    </label>
                    <p className="text-slate-400 text-sm mb-3">
                      Quem é o público-alvo?
                    </p>
                    <Textarea
                      placeholder="Ex: Jovens de 18-35 anos interessados em tecnologia..."
                      value={formData.targetAudience}
                      onChange={(e) =>
                        handleInputChange("targetAudience", e.target.value)
                      }
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ambiente/Situação
                  </label>
                  <p className="text-slate-400 text-sm mb-3">
                    Em qual ambiente/situação será utilizado?
                  </p>
                  <Textarea
                    placeholder="Ex: WhatsApp Business, site da empresa, redes sociais..."
                    value={formData.environment}
                    onChange={(e) =>
                      handleInputChange("environment", e.target.value)
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Other Sections */}
        {[
          {
            key: "personality",
            title: "Personalidade",
            description: "Configure o comportamento e características",
            icon: User,
            color: "purple",
          },
          {
            key: "directives",
            title: "Diretrizes",
            description: "Regras e restrições do negócio",
            icon: Target,
            color: "green",
          },
          {
            key: "structure",
            title: "Estrutura da Conversa",
            description: "Passo a passo do raciocínio",
            icon: MessageSquare,
            color: "orange",
          },
          {
            key: "faq",
            title: "FAQ",
            description: "Perguntas frequentes e respostas",
            icon: HelpCircle,
            color: "cyan",
          },
          {
            key: "examples",
            title: "Exemplos de Uso",
            description: "Interações práticas e modelos",
            icon: Sparkles,
            color: "pink",
          },
          {
            key: "metrics",
            title: "Métricas de Sucesso",
            description: "Como medir o desempenho",
            icon: TrendingUp,
            color: "green",
          },
          {
            key: "links",
            title: "Links de Divulgação",
            description: "Links para divulgação do produto",
            icon: Link,
            color: "blue",
          },
        ].map((section) => (
          <Collapsible
            key={section.key}
            open={
              expandedSections[section.key as keyof typeof expandedSections]
            }
            onOpenChange={() =>
              toggleSection(section.key as keyof typeof expandedSections)
            }
          >
            <Card className="mb-4 bg-slate-800 border-slate-700">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-${section.color}-500/20`}
                      >
                        <section.icon
                          className={`h-5 w-5 text-${section.color}-400`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-white">
                          {section.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    {expandedSections[section.key] ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {section.key === "personality" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tom de Voz
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Ex: formal, informal, amigável, profissional
                          </p>
                          <Textarea
                            placeholder="Como o agente deve se comunicar"
                            value={formData.toneOfVoice}
                            onChange={(e) =>
                              handleInputChange("toneOfVoice", e.target.value)
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nível de Linguagem
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Ex: técnico, simples, acadêmico, coloquial
                          </p>
                          <Textarea
                            placeholder="Defina o nível de complexidade da linguagem"
                            value={formData.languageLevel}
                            onChange={(e) =>
                              handleInputChange("languageLevel", e.target.value)
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Características de Personalidade
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Descreva as características específicas de
                          personalidade que o agente deve ter...
                        </p>
                        <Textarea
                          placeholder="Ex: Empático, prestativo, direto, entusiasta, paciente..."
                          value={formData.personalityCharacteristics}
                          onChange={(e) =>
                            handleInputChange(
                              "personalityCharacteristics",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Conhecimentos Específicos
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Liste os conhecimentos específicos necessários para o
                          agente...
                        </p>
                        <Textarea
                          placeholder="Ex: Conhecimentos sobre produtos, políticas da empresa, processos técnicos..."
                          value={formData.specificKnowledge}
                          onChange={(e) =>
                            handleInputChange(
                              "specificKnowledge",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>
                    </>
                  ) : section.key === "directives" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Políticas Importantes
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Liste as políticas importantes que o agente deve
                          seguir...
                        </p>
                        <Textarea
                          placeholder="Ex: Política de atendimento, regras de desconto, horários de funcionamento..."
                          value={formData.importantPolicies}
                          onChange={(e) =>
                            handleInputChange(
                              "importantPolicies",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Limites de Atuação
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Defina os limites de atuação do agente...
                          </p>
                          <Textarea
                            placeholder="Ex: Não pode oferecer descontos acima de 10%, não pode acessar dados pessoais..."
                            value={formData.actionLimits}
                            onChange={(e) =>
                              handleInputChange("actionLimits", e.target.value)
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={4}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Restrições Legais ou Éticas
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Liste as restrições legais ou éticas...
                          </p>
                          <Textarea
                            placeholder="Ex: LGPD, não pode dar conselhos médicos, não pode discriminar..."
                            value={formData.legalEthicalRestrictions}
                            onChange={(e) =>
                              handleInputChange(
                                "legalEthicalRestrictions",
                                e.target.value
                              )
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={4}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Procedimentos Obrigatórios
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Descreva os procedimentos obrigatórios que o agente
                          deve seguir...
                        </p>
                        <Textarea
                          placeholder="Ex: Sempre confirmar dados do cliente, seguir script de abertura, registrar interações..."
                          value={formData.mandatoryProcedures}
                          onChange={(e) =>
                            handleInputChange(
                              "mandatoryProcedures",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Informações Confidenciais ou Sensíveis (Opcional)
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Liste informações que o agente deve tratar com
                          confidencialidade...
                        </p>
                        <Textarea
                          placeholder="Ex: Dados financeiros, informações pessoais, estratégias comerciais..."
                          value={formData.confidentialInformation}
                          onChange={(e) =>
                            handleInputChange(
                              "confidentialInformation",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>
                    </>
                  ) : section.key === "structure" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          Passo a Passo do Raciocínio
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center">
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          </div>
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Detalhe o passo a passo do raciocínio do agente:
                        </p>
                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4">
                          <div className="text-slate-300 text-sm space-y-3">
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">
                                1. Primeiro passo
                              </div>
                              <div className="ml-4 space-y-1 text-slate-400">
                                <div>- Subtarefas</div>
                                <div>- Considerações importantes</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">
                                2. Segundo passo
                              </div>
                              <div className="ml-4 space-y-1 text-slate-400">
                                <div>- Subtarefas</div>
                                <div>- Considerações importantes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                          Defina como o agente deve estruturar suas respostas e
                          raciocínio
                        </p>
                        <Textarea
                          placeholder={`Exemplo de estrutura:

1. Cumprimentar e identificar a necessidade
   - Saudar cordialmente o cliente
   - Fazer perguntas para entender a demanda
   - Classificar o tipo de solicitação

2. Analisar e propor soluções
   - Consultar base de conhecimento
   - Verificar disponibilidade/políticas
   - Apresentar opções claras

3. Finalizar o atendimento
   - Confirmar entendimento
   - Documentar a interação
   - Oferecer suporte adicional`}
                          value={formData.conversationStepByStep}
                          onChange={(e) =>
                            handleInputChange(
                              "conversationStepByStep",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={12}
                        />
                      </div>
                    </>
                  ) : section.key === "faq" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Perguntas e Respostas Frequentes
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Liste as perguntas frequentes e suas respostas:
                        </p>
                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4">
                          <div className="text-slate-300 text-sm space-y-4">
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">
                                P1: [Pergunta frequente 1]
                              </div>
                              <div className="ml-4 text-slate-400">
                                R1: [Resposta detalhada]
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">
                                P2: [Pergunta frequente 2]
                              </div>
                              <div className="ml-4 text-slate-400">
                                R2: [Resposta detalhada]
                              </div>
                            </div>
                            <div className="text-slate-400 italic">
                              [Continue com mais perguntas relevantes]
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                          Inclua as perguntas mais comuns que os usuários podem
                          fazer
                        </p>
                        <Textarea
                          placeholder={`Exemplo de FAQ:

P1: Qual é o horário de funcionamento?
R1: Funcionamos de segunda a sexta das 8h às 18h, e sábados das 9h às 13h. Domingos e feriados estamos fechados.

P2: Como posso acompanhar meu pedido?
R2: Você pode acompanhar seu pedido através do código de rastreamento enviado por email, ou entrando em contato conosco pelo WhatsApp.

P3: Qual é a política de devolução?
R3: Aceitamos devoluções em até 30 dias após a compra, desde que o produto esteja em perfeitas condições e na embalagem original.

P4: Vocês fazem entrega em toda a cidade?
R4: Sim, fazemos entregas em toda a região metropolitana. O prazo varia de 1 a 3 dias úteis dependendo da localização.

[Continue com mais perguntas relevantes ao seu negócio]`}
                          value={formData.frequentQuestions}
                          onChange={(e) =>
                            handleInputChange(
                              "frequentQuestions",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={14}
                        />
                      </div>
                    </>
                  ) : section.key === "examples" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Exemplos Práticos de Interações
                        </label>
                        <p className="text-slate-400 text-sm mb-3">
                          Forneça exemplos práticos de interações:
                        </p>
                        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4">
                          <div className="text-slate-300 text-sm space-y-6">
                            <div>
                              <div className="font-semibold text-slate-200 mb-2">
                                Exemplo 1:
                              </div>
                              <div className="ml-4 space-y-1">
                                <div>
                                  <span className="text-slate-300">
                                    - Situação:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [Descreva a situação]
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-300">
                                    - Diálogo modelo:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [Mostre a conversa]
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-300">
                                    - Resultado esperado:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [O que deve acontecer]
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 mb-2">
                                Exemplo 2:
                              </div>
                              <div className="ml-4 space-y-1">
                                <div>
                                  <span className="text-slate-300">
                                    - Situação:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [Descreva a situação]
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-300">
                                    - Diálogo modelo:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [Mostre a conversa]
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-300">
                                    - Resultado esperado:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    [O que deve acontecer]
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                          Demonstre como o agente deve se comportar em situações
                          específicas
                        </p>
                        <Textarea
                          placeholder={`Exemplo de Interações Práticas:

Exemplo 1: Cliente interessado em comprar produto
- Situação: Cliente pergunta sobre disponibilidade de um produto específico
- Diálogo modelo:
  Cliente: "Vocês têm o produto X em estoque?"
  Agente: "Sim! Temos o produto X disponível. Ele está com 15% de desconto esta semana. Gostaria de saber mais detalhes sobre as especificações ou tem alguma dúvida específica?"
- Resultado esperado: Engajar o cliente, fornecer informação útil e criar oportunidade de venda

Exemplo 2: Cliente com reclamação
- Situação: Cliente insatisfeito com produto recebido
- Diálogo modelo:
  Cliente: "O produto que recebi veio com defeito"
  Agente: "Sinto muito pelo inconveniente! Vou resolver isso para você imediatamente. Pode me enviar uma foto do defeito? Já vou providenciar a troca sem nenhum custo adicional."
- Resultado esperado: Resolver o problema rapidamente, manter o cliente satisfeito e demonstrar comprometimento

Exemplo 3: Dúvida sobre entrega
- Situação: Cliente quer saber prazo de entrega
- Diálogo modelo:
  Cliente: "Qual o prazo de entrega para meu CEP?"
  Agente: "Para seu CEP, o prazo é de 2-3 dias úteis. Fazemos entrega gratuita para compras acima de R$ 100. Posso calcular o frete exato para você se quiser!"
- Resultado esperado: Informar prazo, destacar benefício da entrega gratuita

[Continue com mais exemplos relevantes ao seu negócio]`}
                          value={formData.practicalExamples}
                          onChange={(e) =>
                            handleInputChange(
                              "practicalExamples",
                              e.target.value
                            )
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          rows={16}
                        />
                      </div>
                    </>
                  ) : section.key === "metrics" ? (
                    <>
                      <div className="space-y-6">
                        {/* Indicadores de Qualidade */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Indicadores de Qualidade
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Defina os indicadores de qualidade para avaliar o
                            desempenho do agente:
                          </p>
                          <Textarea
                            placeholder={`Exemplos de Indicadores de Qualidade:

• Taxa de Resolução na Primeira Interação
  - Meta: 85% dos casos resolvidos sem necessidade de escalação
  - Como medir: (Casos resolvidos na 1ª interação / Total de casos) x 100

• Tempo de Resposta
  - Meta: Resposta em até 30 segundos
  - Como medir: Tempo médio entre pergunta do cliente e resposta do agente

• Satisfação do Cliente
  - Meta: NPS acima de 8.0
  - Como medir: Pesquisa de satisfação pós-atendimento

• Qualidade das Respostas
  - Meta: 90% de respostas consideradas úteis
  - Como medir: Avaliação manual ou feedback do cliente

• Taxa de Conversão
  - Meta: 15% dos leads convertidos em vendas
  - Como medir: (Vendas geradas pelo agente / Total de leads) x 100`}
                            value={formData.qualityIndicators}
                            onChange={(e) =>
                              handleInputChange(
                                "qualityIndicators",
                                e.target.value
                              )
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={12}
                          />
                        </div>

                        {/* Métricas de Desempenho */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Métricas de Desempenho
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Liste as métricas de desempenho (tempo de resposta,
                            precisão, etc.):
                          </p>
                          <Textarea
                            placeholder={`Exemplos de Métricas de Desempenho:

MÉTRICAS OPERACIONAIS:
• Tempo Médio de Resposta: < 30 segundos
• Disponibilidade do Sistema: 99.5% uptime
• Volume de Atendimentos: Capacidade para 500+ conversas simultâneas
• Tempo de Resolução: Média de 5 minutos por caso

MÉTRICAS DE PRECISÃO:
• Acurácia das Respostas: 95% de informações corretas
• Taxa de Erros: Menos de 2% de respostas inadequadas
• Relevância do Conteúdo: 90% das respostas consideradas relevantes

MÉTRICAS DE ENGAJAMENTO:
• Taxa de Interação: 85% dos usuários respondem após primeira mensagem
• Duração Média da Conversa: 3-7 minutos
• Taxa de Abandono: Menos de 10% das conversas abandonadas

MÉTRICAS DE NEGÓCIO:
• Lead Quality Score: Média de 8.5/10
• Cost per Lead: Redução de 40% comparado ao atendimento humano
• Revenue per Conversation: R$ 150 médio por conversa qualificada`}
                            value={formData.performanceMetrics}
                            onChange={(e) =>
                              handleInputChange(
                                "performanceMetrics",
                                e.target.value
                              )
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={14}
                          />
                        </div>

                        {/* Critérios de Avaliação */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Critérios de Avaliação
                          </label>
                          <p className="text-slate-400 text-sm mb-3">
                            Descreva os critérios de avaliação para determinar o
                            sucesso:
                          </p>
                          <Textarea
                            placeholder={`Exemplos de Critérios de Avaliação:

CRITÉRIOS DE SUCESSO PRIMÁRIOS:
1. Resolução Efetiva (Peso: 40%)
   - O agente resolveu completamente a demanda do cliente?
   - A solução foi apropriada e precisa?
   - O cliente ficou satisfeito com o resultado?

2. Qualidade da Comunicação (Peso: 30%)
   - Linguagem clara e adequada ao público?
   - Tom profissional e empático?
   - Informações organizadas e compreensíveis?

3. Eficiência (Peso: 20%)
   - Tempo de resposta dentro dos padrões?
   - Número de interações necessárias?
   - Uso eficiente dos recursos disponíveis?

4. Conformidade (Peso: 10%)
   - Seguiu todas as diretrizes estabelecidas?
   - Respeitou políticas da empresa?
   - Manteve confidencialidade quando necessário?

METODOLOGIA DE AVALIAÇÃO:
• Avaliação automática: 70% (métricas quantitativas)
• Avaliação manual: 30% (qualidade e satisfação)
• Frequência: Análise contínua com relatórios semanais
• Benchmark: Comparação com melhores práticas do setor

AÇÕES CORRETIVAS:
• Score < 7.0: Revisão imediata das configurações
• Score 7.0-8.5: Ajustes pontuais e monitoramento
• Score > 8.5: Modelo de referência para otimizações`}
                            value={formData.evaluationCriteria}
                            onChange={(e) =>
                              handleInputChange(
                                "evaluationCriteria",
                                e.target.value
                              )
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                            rows={16}
                          />
                        </div>
                      </div>
                    </>
                  ) : section.key === "links" ? (
                    <>
                      <div className="space-y-6">
                        <p className="text-slate-400 text-sm">
                          Configure os links para divulgação do produto:
                        </p>

                        {formData.promotionLinks.map((link, index) => (
                          <div
                            key={index}
                            className="bg-slate-700 border border-slate-600 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-200">
                                  Link {index + 1}
                                </h3>
                                {link.isPrimary && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs"
                                  >
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              {formData.promotionLinks.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLink(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  URL do Link
                                </label>
                                <Input
                                  placeholder="https://exemplo.com"
                                  value={link.url}
                                  onChange={(e) =>
                                    updateLink(index, "url", e.target.value)
                                  }
                                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                                />
                                {index === 0 && (
                                  <p className="text-slate-400 text-xs mt-1">
                                    Link principal obrigatório para divulgação
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          onClick={addNewLink}
                          className="w-full border-dashed border-slate-500 text-slate-300 hover:bg-slate-700 hover:border-slate-400"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar novo link
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">
                      Configuração para {section.title.toLowerCase()} será
                      implementada aqui.
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm">
            Faça alterações para salvar automaticamente
          </p>
          <div className="flex gap-3">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSaveConfig}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </div>
      </main>

      {/* Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-red-500" />
              Limite de Agente Atingido
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Você já possui um agente criado em sua conta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                <strong>Limite atingido:</strong> Cada usuário pode criar apenas
                um prompt de agente.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Dica:</strong> Para modificar seu agente existente,
                edite as configurações e salve novamente.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowLimitModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white border border-green-400"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Campo Obrigatório
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Um campo obrigatório precisa ser preenchido.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-100 text-sm">
                <strong>Campo obrigatório:</strong> {missingField}
              </p>
              <p className="text-yellow-200 text-xs mt-2">
                Por favor, preencha este campo antes de salvar sua configuração.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                <strong>Dica:</strong> Todos os campos são obrigatórios para
                garantir que seu agente funcione adequadamente.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowValidationModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white border border-green-400"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Config
