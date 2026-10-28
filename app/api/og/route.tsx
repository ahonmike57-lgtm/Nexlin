import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get("title") || "The Nexlin Journal"
    const author = searchParams.get("author") || "Nexlin Editorial"
    const category = searchParams.get("category") || "Agency OS"
    const readTime = searchParams.get("readTime") || "5 min read"

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#090d16",
            padding: "60px 80px",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Ambient Glows */}
          <div
            style={{
              position: "absolute",
              top: "-150px",
              left: "-100px",
              width: "600px",
              height: "450px",
              backgroundColor: "rgba(37, 99, 235, 0.25)",
              borderRadius: "50%",
              filter: "blur(120px)"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-150px",
              right: "-100px",
              width: "550px",
              height: "400px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              borderRadius: "50%",
              filter: "blur(120px)"
            }}
          />

          {/* Header Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "bold"
                }}
              >
                N
              </div>
              <span style={{ fontSize: "26px", fontWeight: "900", color: "#f8fafc", letterSpacing: "-0.5px" }}>
                NEXLIN
              </span>
              <span style={{ color: "#64748b", fontSize: "20px" }}>/</span>
              <span style={{ fontSize: "16px", color: "#60a5fa", fontWeight: "700", letterSpacing: "1px" }}>
                JOURNAL
              </span>
            </div>

            <div
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                backgroundColor: "rgba(37, 99, 235, 0.18)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#93c5fd",
                fontSize: "14px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              {category}
            </div>
          </div>

          {/* Title Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", zIndex: 10, maxWidth: "1000px" }}>
            <h1
              style={{
                fontSize: title.length > 60 ? "46px" : "56px",
                fontWeight: "900",
                color: "#ffffff",
                lineHeight: "1.15",
                letterSpacing: "-1.5px",
                margin: 0
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(148, 163, 184, 0.2)",
              paddingTop: "24px",
              zIndex: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#93c5fd",
                  fontWeight: "bold",
                  fontSize: "16px"
                }}
              >
                {author.charAt(0)}
              </div>
              <span style={{ fontSize: "16px", color: "#e2e8f0", fontWeight: "600" }}>{author}</span>
              <span style={{ color: "#64748b", fontSize: "16px" }}>•</span>
              <span style={{ fontSize: "16px", color: "#94a3b8" }}>{readTime}</span>
            </div>

            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>
              nexlin-virid.vercel.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    )
  } catch (error: any) {
    return new Response("Failed to generate OG card", { status: 500 })
  }
}
