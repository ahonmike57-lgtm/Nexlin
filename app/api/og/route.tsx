import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get("title") || "The Nexlin Journal").slice(0, 120)
  const author = (searchParams.get("author") || "Nexlin Editorial").slice(0, 60)
  const category = (searchParams.get("category") || "Insights").slice(0, 40)
  const readTime = (searchParams.get("readTime") || "5 min read").slice(0, 30)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #0b1120 0%, #172554 55%, #1e3a8a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "24px",
              }}
            >
              N
            </div>
            <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "0.04em" }}>
              NEXLIN JOURNAL
            </span>
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "rgba(59, 130, 246, 0.25)",
              border: "1px solid rgba(147, 197, 253, 0.4)",
              fontSize: "20px",
              color: "#bfdbfe",
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            fontSize: title.length > 70 ? "44px" : "56px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "1020px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "22px",
            color: "#cbd5e1",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "24px",
          }}
        >
          <span>By {author}</span>
          <span>{readTime}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
