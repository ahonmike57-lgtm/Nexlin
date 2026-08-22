"use client"

import { useState } from "react"
import { Key, Bot, Cpu, Sparkles, ShieldCheck } from "lucide-react"
import { ApiKeyManagement } from "@/components/settings/ApiKeyManagement"
import AiSettingsClient from "../ai/AiSettingsClient"
import McpClient from "../mcp/McpClient"

export default function DeveloperHubClient({
  initialKeys,
  initialAiSettings,
  initialMcpConnections,
  agencyId
}: {
  initialKeys: any[]
  initialAiSettings: any[]
  initialMcpConnections: any[]
  agencyId: string
}) {
  const [activeTab, setActiveTab] = useState<"api" | "ai" | "mcp">("api")

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Developer & API Hub</h1>
        <p className="text-text-secondary text-sm">
          Manage API tokens for external integrations, optional custom AI credentials (BYOK), and MCP servers.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "api"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Agency API Keys</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "ai"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Custom AI Keys (BYOK)</span>
        </button>

        <button
          onClick={() => setActiveTab("mcp")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "mcp"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>MCP Server Connections</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "api" && (
          <ApiKeyManagement initialKeys={initialKeys} />
        )}

        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Platform AI is enabled by default:</strong> You do not need to provide custom keys. Entering custom keys is optional and allows you to bypass platform rate limits and bill OpenAI/Anthropic directly to your account.
              </span>
            </div>
            <AiSettingsClient initialSettings={initialAiSettings} agencyId={agencyId} />
          </div>
        )}

        {activeTab === "mcp" && (
          <McpClient initialConnections={initialMcpConnections} />
        )}
      </div>
    </div>
  )
}
