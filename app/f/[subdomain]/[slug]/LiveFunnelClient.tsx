"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Editor, Frame, useNode } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { submitLiveFunnelForm } from "@/app/actions/funnels"

// Reusable CraftJS Components (Legacy Builder compatibility)
const ContainerComponent = ({ children, padding = 20, background = "#ffffff" }: any) => {
  const {
    connectors: { connect, drag },
  } = useNode()
  return (
    <div
      ref={(ref: any) => connect(drag(ref))}
      style={{ padding: `${padding}px`, backgroundColor: background }}
      className="w-full"
    >
      {children}
    </div>
  )
}
ContainerComponent.craft = {
  props: { padding: 20, background: "#ffffff" },
  rules: { canDrag: () => true },
}

const TextComponent = ({ text, fontSize = 16, textAlign = "left", color = "#000000" }: any) => {
  const {
    connectors: { connect, drag },
  } = useNode()
  return (
    <div
      ref={(ref: any) => connect(drag(ref))}
      style={{ fontSize: `${fontSize}px`, textAlign, color }}
      className="p-2"
    >
      {text}
    </div>
  )
}
TextComponent.craft = {
  props: { text: "Text block", fontSize: 16, textAlign: "left", color: "#000000" },
  rules: { canDrag: () => true },
}

const ButtonComponent = ({ text = "Click Me", variant = "default" }: any) => {
  const {
    connectors: { connect, drag },
  } = useNode()
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="inline-block p-2">
      <Button variant={variant}>{text}</Button>
    </div>
  )
}
ButtonComponent.craft = {
  props: { text: "Click Me", variant: "default" },
  rules: { canDrag: () => true },
}

const ImageComponent = ({ src = "https://via.placeholder.com/400x200" }: any) => {
  const {
    connectors: { connect, drag },
  } = useNode()
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="p-2">
      <img src={src} alt="Live Page Image" className="w-full h-auto rounded-lg" />
    </div>
  )
}
ImageComponent.craft = {
  props: { src: "https://via.placeholder.com/400x200" },
  rules: { canDrag: () => true },
}

function isCraftJson(raw: string | null | undefined): boolean {
  if (!raw) return false
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "{}" || trimmed.startsWith("<")) return false
  try {
    const parsed = JSON.parse(trimmed)
    return Boolean(parsed && typeof parsed === "object" && "ROOT" in parsed)
  } catch {
    return false
  }
}

function injectNexlinBridge(rawHtml: string, validPaths: string[]): string {
  const serializedPaths = JSON.stringify(validPaths).replace(/</g, "\\u003c")
  const bridgeScript = `<script>
(function(){
  var VALID_PATHS = ${serializedPaths};
  var activeForm = null;
  function setBanner(form, ok, msg) {
    var el = form.querySelector("[data-nexlin-status]");
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-nexlin-status", "1");
      el.style.marginTop = "12px";
      el.style.padding = "10px 14px";
      el.style.borderRadius = "8px";
      el.style.fontSize = "13px";
      el.style.fontWeight = "500";
      form.appendChild(el);
    }
    el.style.background = ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
    el.style.color = ok ? "#065f46" : "#991b1b";
    el.style.border = ok ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(239,68,68,0.35)";
    el.textContent = msg;
  }
  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;
    e.preventDefault();
    activeForm = form;
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function(v, k) { payload[k] = typeof v === "string" ? v : ""; });
    var btns = form.querySelectorAll("button[type='submit'],input[type='submit']");
    btns.forEach(function(b) { b.disabled = true; });
    window.parent.postMessage({ type: "NEXLIN_LEAD_SUBMIT", payload: payload }, "*");
  }, true);
  document.addEventListener("click", function(e) {
    var anchor = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!anchor) return;
    var href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    var normalized = "/" + href.replace(/^\\/+/, "").split("?")[0].split("#")[0].replace(/\\/+$/, "");
    if (normalized === "/home") normalized = "/";
    if (VALID_PATHS.indexOf(normalized) !== -1) {
      e.preventDefault();
      window.parent.postMessage({ type: "NEXLIN_NAVIGATE", path: normalized }, "*");
    }
  }, true);
  window.addEventListener("message", function(e) {
    if (!e.data || e.data.type !== "NEXLIN_LEAD_RESULT" || !activeForm) return;
    var btns = activeForm.querySelectorAll("button[type='submit'],input[type='submit']");
    btns.forEach(function(b) { b.disabled = false; });
    setBanner(activeForm, !!e.data.ok, e.data.message || (e.data.ok ? "Submitted!" : "Failed to submit"));
    if (e.data.ok) { try { activeForm.reset(); } catch (_) {} }
  });
})();
</script>`

  if (/<\/body>/i.test(rawHtml)) {
    return rawHtml.replace(/<\/body>/i, `${bridgeScript}</body>`)
  }
  return `${rawHtml}\n${bridgeScript}`
}

export default function LiveFunnelClient({
  funnel,
  step,
  subdomain,
  pages = [],
}: {
  funnel: any
  step: any
  subdomain: string
  pages?: Array<{ id: string; name: string; path: string }>
}) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const rawContent = typeof step?.content === "string" ? step.content : ""
  const craftMode = isCraftJson(rawContent)
  const htmlMode = !craftMode && rawContent.trim() !== "" && rawContent.trim() !== "{}"

  const validPaths = useMemo(() => {
    const base = pages.map((p) => p.path)
    if (!base.includes("/")) base.push("/")
    return base
  }, [pages])

  const bridgedHtml = useMemo(() => {
    if (!htmlMode) return ""
    return injectNexlinBridge(rawContent, validPaths)
  }, [htmlMode, rawContent, validPaths])

  useEffect(() => {
    if (!htmlMode) return

    const onMessage = async (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return
      }
      const msg = event.data
      if (!msg || typeof msg !== "object") return

      if (msg.type === "NEXLIN_NAVIGATE" && typeof msg.path === "string") {
        const target =
          msg.path === "/"
            ? `/f/${subdomain}`
            : `/f/${subdomain}/${msg.path.replace(/^\/+/, "")}`
        router.push(target)
        return
      }

      if (msg.type === "NEXLIN_LEAD_SUBMIT") {
        const res = await submitLiveFunnelForm(subdomain, msg.payload || {})
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "NEXLIN_LEAD_RESULT",
            ok: Boolean(res.success),
            message: res.success
              ? (res as any).message || "Thank you! Your submission has been received."
              : (res as any).error || "Submission failed. Please try again.",
          },
          "*"
        )
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [htmlMode, router, subdomain])

  if (htmlMode) {
    return (
      <div className="min-h-screen w-full bg-white">
        <iframe
          ref={iframeRef}
          srcDoc={bridgedHtml}
          sandbox="allow-scripts allow-forms"
          className="w-full min-h-screen border-0 block"
          title={funnel?.name || step?.name || subdomain}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Editor
        resolver={{ ContainerComponent, TextComponent, ButtonComponent, ImageComponent }}
        enabled={false}
      >
        {craftMode ? (
          <Frame data={rawContent} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <h1 className="text-4xl font-bold mb-4">{step.name}</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
              This page has no published content yet. Open the AI Website Builder to generate or edit it.
            </p>
          </div>
        )}
      </Editor>
    </div>
  )
}
