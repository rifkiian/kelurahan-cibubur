import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1),
      }),
    )
    .optional(),
});

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

async function callGemini(message: string, history?: Array<{ role: "user" | "assistant"; text: string }>) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("missing_api_key");
  }

  const model = process.env.GOOGLE_GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = {
    parts: [
      {
        text:
          "Kamu adalah chatbot resmi layanan informasi Kelurahan Cibubur. Jawab dengan ramah, sopan, singkat, dan jelas dalam Bahasa Indonesia. Jangan pernah meminta data sensitif (PIN, OTP, nomor rekening). Jangan mengarang; jika tidak yakin, bilang tidak yakin dan arahkan ke admin/petugas. Jika pertanyaan di luar konteks kelurahan, jawab: 'Mohon maaf, saya hanya melayani informasi terkait Kelurahan Cibubur.' Jika pertanyaan tentang layanan administrasi, arahkan ke menu Layanan dan sebutkan bahwa persyaratan & alur tersedia di halaman detail layanan. Jika pertanyaan tentang pengaduan warga, arahkan ke menu Pengaduan dan jelaskan cara mengajukan. Jika butuh bantuan lanjutan, arahkan untuk menunggu admin/petugas pada jam kerja. Akhiri dengan kalimat penutup yang ramah bila sesuai.",
      },
    ],
  };

  const contents: GeminiContent[] = [];

  const historySafe = (history || []).slice(-8);
  for (const h of historySafe) {
    contents.push({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    });
  }

  contents.push({ role: "user", parts: [{ text: message }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`gemini_error:${res.status}:${text}`);
  }

  const data = (await res.json()) as any;
  const candidate = data?.candidates?.[0];
  const replyText = candidate?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n");
  if (!replyText) throw new Error("empty_reply");
  return replyText as string;
}

router.post("/", async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  try {
    const reply = await callGemini(parsed.data.message, parsed.data.history);
    return res.json({ reply });
  } catch (e) {
    console.error("chat_error", e);
    const msg = e instanceof Error ? e.message : "unknown_error";
    if (msg === "missing_api_key") {
      return res.status(500).json({ message: "Server misconfigured" });
    }
    if (msg.startsWith("gemini_error:")) {
      return res.status(502).json({ message: msg });
    }
    return res.status(500).json({ message: msg || "Chat error" });
  }
});

export default router;
