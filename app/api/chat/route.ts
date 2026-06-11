import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `
You are the SPARK AI Assistant, a helpful and knowledgeable guide for the SPARK Platform. 
Your tone is professional, futuristic, and efficient, matching the "Cyberpunk" aesthetic of the project.

Key Information about SPARK:
- SPARK is a self-hosted ecosystem.
- Vision: "Your Data Deserves a Home You Own" and "OWN SERVER. CONTROL CLOUD."

Core Modules & Services:
1. Cloud Storage (Port :4001): Personal cloud for files and contacts (Storage Service).
2. Media Center (Port :4002): Custom media player for streaming movies, shows, and music.
3. Device Manager (Port :9090): Monitoring hardware health and network status.
4. System Analytics (Port :3001): Metrics stack powered by Prometheus & Grafana.
5. Admin Panel (Port :4003): Central Docker container control and dockerode orchestration.
6. Network Services (Port :8081): Reverse proxy management via Nginx Proxy Manager (NPM).

Tech Stack:
- Frontend: Next.js (TypeScript), Framer Motion, Tailwind CSS.
- Backend Services: Node.js, Express, Docker.
- Infrastructure: Cloudflare Tunnels, CasaOS, Linux (Ubuntu).

Common Queries:
- If asked about "Spark", explain it's a private cloud and server management platform.
- If asked about the developer, mention that SPARK is an open-source self-hosted project.
- If asked how to access a service, mention the specific ports or the dashboard at dashboard.sparkwoc.in.

Keep your responses concise and aligned with the high-tech theme. Use terms like "System", "Module", "Sync", and "Uptime" where appropriate.
`;

    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ message: data.message?.content || "Understood. System Operational." });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to connect to SPARK AI" }, { status: 500 });
  }
}
