import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { getSupabase } from "@/utils/supabase";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

type ChatApiHistoryItem = {
  role: "user" | "assistant";
  text: string;
};

type SupabaseMessage = {
  id: number;
  user_id: string;
  content: string;
  role: "user" | "admin";
  created_at: string;
};

type LocalReply = {
  text: string;
  quickReplies: string[];
  action?: "goto_pengaduan" | "goto_layanan";
};

const STORAGE_KEY = "kc_chatbot_history_v1";
const PROFILE_KEY = "kc_chatbot_profile_v1";

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

function normalize(s: string) {
  return s.toLowerCase().trim();
}

type ChatProfile = {
  name: string;
  phone: string;
};

function getJakartaNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const weekday = get("weekday") || "";
  const hour = Number(get("hour") || "0");
  const minute = Number(get("minute") || "0");
  return { weekday, hour, minute };
}

function isInServiceHours() {
  const { weekday, hour, minute } = getJakartaNow();
  const isWeekday = weekday === "Mon" || weekday === "Tue" || weekday === "Wed" || weekday === "Thu" || weekday === "Fri";
  if (!isWeekday) return false;
  const mins = hour * 60 + minute;
  return mins >= 8 * 60 && mins < 16 * 60;
}

function isValidPhone(phone: string) {
  const cleaned = phone.replace(/\s|\-|\(|\)/g, "");
  if (!/^[+]?\d{9,16}$/.test(cleaned)) return false;
  return true;
}

function encodeUserContent(text: string, profile: ChatProfile) {
  const meta = JSON.stringify({ name: profile.name, phone: profile.phone });
  return `__META__${meta}__\n${text}`;
}

function decodeUserContent(content: string) {
  if (!content.startsWith("__META__")) return { displayText: content, profile: null as ChatProfile | null };
  const end = content.indexOf("__", "__META__".length);
  if (end <= 0) return { displayText: content, profile: null as ChatProfile | null };
  const json = content.slice("__META__".length, end);
  const rest = content.slice(end + 2).replace(/^\n/, "");
  try {
    const parsed = JSON.parse(json) as { name?: string; phone?: string };
    if (parsed?.name && parsed?.phone) {
      return { displayText: rest, profile: { name: String(parsed.name), phone: String(parsed.phone) } };
    }
    return { displayText: rest || content, profile: null as ChatProfile | null };
  } catch {
    return { displayText: rest || content, profile: null as ChatProfile | null };
  }
}

function stripBotPrefix(content: string) {
  if (content.startsWith("__BOT__")) return content.slice("__BOT__".length).trimStart();
  return content;
}

const DEFAULT_QUICK_REPLIES = [
  "Jam operasional kantor",
  "Syarat surat nikah",
  "Cara mengurus KTP",
  "Lokasi kantor kelurahan",
  "Butuh bantuan petugas",
];

const ADMIN_WA_NUMBER = (import.meta.env.VITE_ADMIN_WA_NUMBER as string | undefined)?.trim() || "";
const ADMIN_WA_LABEL = (import.meta.env.VITE_ADMIN_WA_LABEL as string | undefined)?.trim() || "Admin Kelurahan";

function assistantReplyFor(message: string): LocalReply {
  const m = normalize(message);

  if (m.includes(normalize("butuh bantuan petugas")) || m.includes(normalize("hubungi admin")) || m.includes(normalize("whatsapp admin"))) {
    return {
      text: "Baik. Jika ingin dibantu petugas, silakan hubungi admin melalui WhatsApp.",
      quickReplies: ["Hubungi Admin via WhatsApp", "Jam operasional kantor"],
    };
  }

  if (m === normalize("buka halaman pengaduan")) {
    return {
      text: "Baik, saya arahkan ke halaman Pengaduan.",
      quickReplies: ["Cara ajukan pengaduan", "Lihat layanan"],
      action: "goto_pengaduan" as const,
    };
  }

  if (m === normalize("buka halaman layanan") || m === normalize("lihat layanan")) {
    return {
      text: "Baik, saya arahkan ke halaman Layanan.",
      quickReplies: ["Syarat surat domisili", "Cara ajukan pengaduan"],
      action: "goto_layanan" as const,
    };
  }

  if (m.includes("jam") || m.includes("operasional") || m.includes("buka") || m.includes("tutup")) {
    return {
      text: "Jam operasional kantor kelurahan umumnya: Senin–Jumat 08.00–16.00. Untuk jadwal terbaru, silakan cek halaman Kontak.",
      quickReplies: ["Lokasi kantor kelurahan", "Cara mengurus KTP"],
    };
  }

  if (m.includes("alamat") || m.includes("lokasi") || m.includes("maps") || m.includes("kantor kelurahan")) {
    return {
      text: "Lokasi kantor kelurahan bisa kamu lihat di halaman Kontak (beranda bagian bawah) pada peta dan alamat lengkap.",
      quickReplies: ["Jam operasional kantor", "Cara mengurus KTP"],
    };
  }

  if (m.includes("ktp") || m.includes("kartu tanda penduduk")) {
    return {
      text: "Cara mengurus KTP biasanya: siapkan KK, KTP lama (jika perpanjangan/perubahan), surat pengantar RT/RW (jika diperlukan), lalu datang ke kelurahan/kecamatan sesuai prosedur setempat. Untuk detail layanan, silakan cek menu Layanan (lihat persyaratan & alur).",
      quickReplies: ["Lokasi kantor kelurahan", "Jam operasional kantor"],
    };
  }

  if (m.includes("nikah") || m.includes("surat nikah") || m.includes("pencatatan nikah")) {
    return {
      text: "Syarat surat nikah biasanya meliputi: fotokopi KTP & KK calon mempelai, pas foto, akta kelahiran, surat pengantar RT/RW, dan formulir dari kelurahan/KUA (tergantung kebutuhan). Persyaratan bisa berbeda, silakan cek layanan terkait di menu Layanan atau tanyakan langsung ke petugas.",
      quickReplies: ["Cara mengurus KTP", "Lokasi kantor kelurahan"],
    };
  }

  if (m.includes("domisili") || m.includes("surat domisili")) {
    return {
      text: "Untuk mengurus Surat Keterangan Domisili, biasanya diperlukan: fotokopi KTP, fotokopi KK, surat pengantar RT/RW, dan formulir permohonan. Persyaratan bisa berbeda, silakan cek detail layanan di menu Layanan.",
      quickReplies: ["Lihat layanan", "Cara ajukan pengaduan"],
    };
  }

  if (
    (m.includes("akta") && m.includes("lahir")) ||
    m.includes("akte lahir") ||
    m.includes("akta kelahiran") ||
    m.includes("pembuatan akta lahir")
  ) {
    return {
      text:
        "Persyaratan pembuatan Akta Lahir:\n" +
        "- Surat keterangan lahir dari Rumah Sakit / Bidan / Klinik\n" +
        "- Fotokopi KTP orang tua\n" +
        "- Fotokopi Kartu Keluarga (KK)\n" +
        "- Fotokopi Buku Nikah / Akta Perkawinan\n" +
        "- Mengisi Formulir F.201 dari Kelurahan",
      quickReplies: ["Lokasi kantor kelurahan", "Jam operasional kantor", "Butuh bantuan petugas"],
    };
  }

  if ((m.includes("akta") && m.includes("kematian")) || m.includes("akta kematian") || m.includes("akte kematian")) {
    return {
      text:
        "Persyaratan pembuatan Akta Kematian:\n" +
        "- Surat keterangan kematian dari Rumah Sakit / Puskesmas\n" +
        "- Fotokopi KTP dan KK almarhum\n" +
        "- Fotokopi KTP dan KK ahli waris\n" +
        "- Mengisi Formulir F.201 dari Kelurahan",
      quickReplies: ["Lokasi kantor kelurahan", "Jam operasional kantor", "Butuh bantuan petugas"],
    };
  }

  if (m.includes("ktp") || m.includes("ktp-el") || m.includes("ktpel") || m.includes("kartu tanda penduduk")) {
    if (m.includes("rusak")) {
      return {
        text:
          "Persyaratan penggantian KTP-el rusak:\n" +
          "- Membawa KTP asli yang rusak\n" +
          "- Fotokopi Kartu Keluarga (KK)\n" +
          "- Mengisi Formulir F.102",
        quickReplies: ["KTP-el (Hilang)", "KTP-el (Baru)", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("hilang")) {
      return {
        text:
          "Persyaratan penggantian KTP-el hilang:\n" +
          "- Surat keterangan kehilangan dari Kepolisian\n" +
          "- Fotokopi Kartu Keluarga (KK)\n" +
          "- Mengisi Formulir F.102",
        quickReplies: ["KTP-el (Rusak)", "KTP-el (Baru)", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("baru") || m.includes("buat") || m.includes("pembuatan")) {
      return {
        text:
          "Persyaratan pembuatan KTP-el baru:\n" +
          "- Fotokopi Akta Lahir\n" +
          "- Fotokopi Kartu Keluarga (KK)\n" +
          "- Mengisi Formulir F.102",
        quickReplies: ["KTP-el (Hilang)", "KTP-el (Rusak)", "Butuh bantuan petugas"],
      };
    }
  }

  if (m.includes("kartu keluarga") || m.includes(" kk") || m === "kk" || m.includes("kartu keluarga (kk)")) {
    if (m.includes("baru")) {
      return {
        text:
          "Persyaratan pembuatan KK baru:\n" +
          "- Fotokopi Akta Perkawinan / Buku Nikah\n" +
          "- Fotokopi Kutipan Akta Cerai (jika ada)\n" +
          "- Surat Keterangan Pindah Datang (SKPD) jika pindah dari daerah lain",
        quickReplies: ["Perubahan Data Kartu Keluarga", "KK Hilang / Rusak", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("perubahan") || m.includes("ubah") || m.includes("perbarui") || m.includes("data")) {
      return {
        text:
          "Persyaratan perubahan data pada KK:\n" +
          "- Mengisi dan menandatangani Formulir F.102 di Kelurahan\n" +
          "- Membawa KK lama\n" +
          "- Dokumen pendukung perubahan data (akta, ijazah, dan dokumen lainnya)",
        quickReplies: ["KK Hilang / Rusak", "Kartu Keluarga (KK) Baru", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("hilang") || m.includes("rusak")) {
      return {
        text:
          "Persyaratan penggantian KK hilang atau rusak:\n" +
          "- Surat keterangan kehilangan dari Kepolisian (jika hilang)\n" +
          "- KTP-el atau KK lama (jika rusak)",
        quickReplies: ["Perubahan Data Kartu Keluarga", "Kartu Keluarga (KK) Baru", "Butuh bantuan petugas"],
      };
    }
  }

  if (m.includes("pindah") || m.includes("pindah domisili") || m.includes("pindah datang") || m.includes("mutasi")) {
    if (m.includes("masuk") || m.includes("datang")) {
      return {
        text:
          "Persyaratan pindah domisili (masuk kelurahan):\n" +
          "- Surat Pindah dari daerah asal\n" +
          "- Fotokopi KTP dari daerah asal\n" +
          "- Fotokopi KK dari daerah asal\n" +
          "- Mengisi Formulir F.102",
        quickReplies: ["Pindah Domisili (Keluar)", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("keluar")) {
      return {
        text:
          "Persyaratan pindah domisili (keluar):\n" +
          "- Fotokopi KTP\n" +
          "- Fotokopi Kartu Keluarga\n" +
          "- Mengisi Formulir F.102",
        quickReplies: ["Pindah Domisili (Masuk Kelurahan)", "Butuh bantuan petugas"],
      };
    }
  }

  if (m.includes("kia") || m.includes("kartu identitas anak")) {
    if (m.includes("hilang") || m.includes("rusak")) {
      return {
        text:
          "Persyaratan penggantian KIA hilang atau rusak:\n" +
          "- Surat keterangan kehilangan dari Kepolisian atau KIA lama (jika rusak)\n" +
          "- Fotokopi Kartu Keluarga\n" +
          "- Pas foto ukuran 2×3 sebanyak 2 lembar (usia ≥ 5 tahun)",
        quickReplies: ["KIA (Kartu Identitas Anak) Baru", "KIA karena Pindah Datang", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("pindah") || m.includes("datang")) {
      return {
        text:
          "Persyaratan KIA karena pindah datang:\n" +
          "- KIA lama\n" +
          "- Fotokopi Kartu Keluarga\n" +
          "- Pas foto ukuran 2×3 (usia ≥ 5 tahun)",
        quickReplies: ["KIA (Kartu Identitas Anak) Baru", "Butuh bantuan petugas"],
      };
    }
    if (m.includes("baru") || m.includes("buat") || m.includes("pembuatan")) {
      return {
        text:
          "Persyaratan pembuatan KIA baru:\n" +
          "- Fotokopi Akta Lahir Anak\n" +
          "- Fotokopi Kartu Keluarga\n" +
          "- Pas foto ukuran 2×3 sebanyak 2 lembar (untuk anak usia ≥ 5 tahun)",
        quickReplies: ["KIA Hilang / Rusak", "Butuh bantuan petugas"],
      };
    }
  }

  if (m.includes("skp") || m.includes("skpd")) {
    return {
      text: "Untuk layanan SKP/SKPD, mohon sebutkan apakah yang dimaksud Surat Keterangan Pindah (SKP) atau Surat Keterangan Pindah Datang (SKPD), agar saya bisa bantu persyaratannya. Jika ingin dibantu petugas, silakan pilih 'Butuh bantuan petugas'.",
      quickReplies: ["Pindah Domisili (Masuk Kelurahan)", "Pindah Domisili (Keluar)", "Butuh bantuan petugas"],
    };
  }

  if (m.includes("pengaduan") || m.includes("lapor") || m.includes("keluhan")) {
    return {
      text: "Untuk membuat pengaduan, buka menu Pengaduan lalu isi data, lokasi, kategori, dan deskripsi. Jika ada foto, kamu bisa lampirkan.",
      quickReplies: ["Buka halaman pengaduan", "Status pengaduan"],
    };
  }

  if (m.includes("status")) {
    return {
      text: "Status pengaduan akan diproses oleh admin. Jika kamu sudah mengirim, admin akan melihatnya di dashboard dan memperbarui statusnya.",
      quickReplies: ["Buka halaman pengaduan"],
    };
  }

  if (m.includes("layanan") || m.includes("surat") || m.includes("persyaratan")) {
    return {
      text: "Kamu bisa lihat daftar layanan di menu Layanan. Di halaman detail layanan tersedia Persyaratan dan Alur Layanan.",
      quickReplies: ["Buka halaman layanan", "Syarat surat domisili"],
    };
  }

  return {
    text: "Silakan tanyakan tentang layanan atau pengaduan. Kamu juga bisa pilih pertanyaan cepat di bawah.",
    quickReplies: [
      "Jam operasional kantor",
      "Syarat surat nikah",
      "Cara mengurus KTP",
      "Lokasi kantor kelurahan",
    ],
  };
}

export function ChatbotWidget() {
  const navigate = useNavigate();
  const supabase = getSupabase();
  const [supabaseUserId, setSupabaseUserId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waEscalationEnabled, setWaEscalationEnabled] = useState(false);
  const [profile, setProfile] = useState<ChatProfile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ChatProfile;
      if (!parsed?.name || !parsed?.phone) return null;
      return parsed;
    } catch {
      return null;
    }
  });
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (supabase) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  });

  const [quickReplies, setQuickReplies] = useState<string[]>(() => DEFAULT_QUICK_REPLIES);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const supabaseSeenIdsRef = useRef<Set<number>>(new Set());

  const hasGreeting = useMemo(() => messages.some((m) => m.role === "assistant"), [messages]);

  const profileReady = !!profile?.name && !!profile?.phone;

  const openWhatsApp = (text: string) => {
    if (!ADMIN_WA_NUMBER) return;
    const url = `https://wa.me/${ADMIN_WA_NUMBER}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!profile) return;
    setProfileName(profile.name);
    setProfilePhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    if (!profileReady) return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
    }
  }, [profileReady, profile]);

  useEffect(() => {
    if (!hasGreeting && messages.length === 0) {
      setMessages([
        {
          id: makeId(),
          role: "assistant",
          text: "Selamat datang di Layanan Chat Kelurahan Cibubur. Sebelum mulai, silakan masukkan Nama Lengkap dan Nomor WhatsApp aktif.",
          createdAt: Date.now(),
        },
      ]);
    }
  }, [hasGreeting]);

  useEffect(() => {
    if (supabase) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
    }
  }, [messages]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    (async () => {
      const sessionRes = await supabase.auth.getSession();
      let session = sessionRes.data.session;

      if (!session) {
        const signInRes = await supabase.auth.signInAnonymously();
        session = signInRes.data.session;
      }

      const uid = session?.user?.id || "";
      if (cancelled) return;
      setSupabaseUserId(uid);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || "";
      if (cancelled) return;
      setSupabaseUserId(uid);
    });

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    if (!supabaseUserId) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", supabaseUserId)
        .order("created_at");
      if (cancelled) return;
      if (error) return;
      const rows = (data || []) as SupabaseMessage[];
      const seen = new Set<number>();
      for (const r of rows) seen.add(r.id);
      supabaseSeenIdsRef.current = seen;

      setMessages(
        rows.map((r) => ({
          id: String(r.id),
          role: r.role === "admin" ? "assistant" : "user",
          text: r.role === "admin" ? stripBotPrefix(r.content) : decodeUserContent(r.content).displayText,
          createdAt: Date.parse(r.created_at) || Date.now(),
        })),
      );
    })();

    const channel = supabase
      .channel("realtime-chat-widget")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${supabaseUserId}` },
        (payload) => {
          const row = payload.new as SupabaseMessage;
          if (!row?.id) return;
          if (supabaseSeenIdsRef.current.has(row.id)) return;
          supabaseSeenIdsRef.current.add(row.id);
          setMessages((prev) => [
            ...prev,
            {
              id: String(row.id),
              role: row.role === "admin" ? "assistant" : "user",
              text: row.role === "admin" ? stripBotPrefix(row.content) : decodeUserContent(row.content).displayText,
              createdAt: Date.parse(row.created_at) || Date.now(),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, supabaseUserId]);

  const refreshChat = async () => {
    if (sending) return;
    if (supabase) {
      if (!supabaseUserId) return;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", supabaseUserId)
        .order("created_at");
      if (error) return;
      const rows = (data || []) as SupabaseMessage[];
      const seen = new Set<number>();
      for (const r of rows) seen.add(r.id);
      supabaseSeenIdsRef.current = seen;
      setMessages(
        rows.map((r) => ({
          id: String(r.id),
          role: r.role === "admin" ? "assistant" : "user",
          text: r.role === "admin" ? stripBotPrefix(r.content) : decodeUserContent(r.content).displayText,
          createdAt: Date.parse(r.created_at) || Date.now(),
        })),
      );
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (!Array.isArray(parsed)) return;
      setMessages(parsed);
    } catch {
    }
  };

  const clearChat = () => {
    if (sending) return;
    setInput("");
    setQuickReplies(DEFAULT_QUICK_REPLIES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }

    const greeting = profileReady
      ? `Terima kasih, Bapak/Ibu ${profile?.name}, ada yang bisa kami bantu?`
      : "Selamat datang di Layanan Chat Kelurahan Cibubur. Sebelum mulai, silakan masukkan Nama Lengkap dan Nomor WhatsApp aktif.";
    setMessages([
      {
        id: makeId(),
        role: "assistant",
        text: greeting,
        createdAt: Date.now(),
      },
    ]);
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const panelEl = panelRef.current;
      const btnEl = buttonRef.current;
      if (panelEl && panelEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (sending) return;
    if (!profileReady) return;

    if (normalize(trimmed) === normalize("Hubungi Admin via WhatsApp")) {
      setWaEscalationEnabled(true);
      setMessages((prev) => [...prev, { id: makeId(), role: "user", text: trimmed, createdAt: Date.now() }]);
      if (ADMIN_WA_NUMBER) openWhatsApp(messages.slice(-1)[0]?.text || "");
      return;
    }

    const localReply = assistantReplyFor(trimmed);
    if (localReply.action === "goto_pengaduan") {
      setQuickReplies(localReply.quickReplies);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", text: trimmed, createdAt: Date.now() },
        { id: makeId(), role: "assistant", text: localReply.text, createdAt: Date.now() },
      ]);
      navigate("/pengaduan");
      return;
    }

    if (localReply.action === "goto_layanan") {
      setQuickReplies(localReply.quickReplies);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", text: trimmed, createdAt: Date.now() },
        { id: makeId(), role: "assistant", text: localReply.text, createdAt: Date.now() },
      ]);
      navigate("/layanan");
      return;
    }

    if (supabase) {
      if (!supabaseUserId) return;
      try {
        setSending(true);
        const optimisticId = makeId();
        setMessages((prev) => [...prev, { id: optimisticId, role: "user", text: trimmed, createdAt: Date.now() }]);
        const userPayload = encodeUserContent(trimmed, profile as ChatProfile);
        const { data: createdUser, error: insertUserError } = await supabase
          .from("messages")
          .insert([{ content: userPayload, role: "user" }])
          .select("*")
          .single();
        if (!insertUserError && createdUser) {
          const row = createdUser as SupabaseMessage;
          supabaseSeenIdsRef.current.add(row.id);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticId
                ? {
                    id: String(row.id),
                    role: "user",
                    text: decodeUserContent(row.content).displayText,
                    createdAt: Date.parse(row.created_at) || Date.now(),
                  }
                : m,
            ),
          );
        }

        if (isInServiceHours()) {
          setQuickReplies([]);
          setMessages((prev) => [
            ...prev,
            {
              id: makeId(),
              role: "assistant",
              text: `Terima kasih, Bapak/Ibu ${profile?.name}. Saat ini kami berada dalam jam layanan. Silakan tunggu sebentar, admin kami akan segera membalas pesan Anda.`,
              createdAt: Date.now(),
            },
          ]);
          setWaEscalationEnabled(true);
          return;
        }

        const history: ChatApiHistoryItem[] = messages
          .slice(-8)
          .map((m) => ({ role: m.role, text: m.text }))
          .filter((m): m is ChatApiHistoryItem => m.role === "user" || m.role === "assistant");

        let replyText = "";
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Nama warga: ${profile?.name}. Pertanyaan: ${trimmed}`, history }),
          });
          if (!res.ok) throw new Error("chat_failed");
          const data = (await res.json()) as { reply?: string };
          replyText = data.reply?.trim() || "";
        } catch {
          replyText = localReply.text;
          setWaEscalationEnabled(true);
        }

        if (replyText) {
          setQuickReplies([
            "Jam operasional kantor",
            "Syarat surat nikah",
            "Cara mengurus KTP",
            "Lokasi kantor kelurahan",
            "Butuh bantuan petugas",
          ]);
          const { data: createdAdmin } = await supabase
            .from("messages")
            .insert([{ content: `__BOT__${replyText}`, role: "admin" }])
            .select("*")
            .single();
          if (createdAdmin) {
            const row = createdAdmin as SupabaseMessage;
            supabaseSeenIdsRef.current.add(row.id);
            setMessages((prev) => [
              ...prev,
              {
                id: String(row.id),
                role: "assistant",
                text: stripBotPrefix(row.content),
                createdAt: Date.parse(row.created_at) || Date.now(),
              },
            ]);
          }
        }
      } finally {
        setSending(false);
      }
      return;
    }

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: trimmed, createdAt: Date.now() };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    if (isInServiceHours()) {
      setQuickReplies([]);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: `Terima kasih, Bapak/Ibu ${profile?.name}. Saat ini kami berada dalam jam layanan. Silakan tunggu sebentar, admin kami akan segera membalas pesan Anda.`,
          createdAt: Date.now(),
        },
      ]);
      setSending(false);
      return;
    }

    try {
      const history: ChatApiHistoryItem[] = [...messages, userMsg]
        .slice(-10)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Nama warga: ${profile?.name}. Pertanyaan: ${trimmed}`, history }),
      });

      if (!res.ok) throw new Error("chat_failed");
      const data = (await res.json()) as { reply?: string };
      const replyText = data.reply?.trim();
      if (!replyText) throw new Error("empty_reply");

      setQuickReplies([
        "Jam operasional kantor",
        "Syarat surat nikah",
        "Cara mengurus KTP",
        "Lokasi kantor kelurahan",
        "Butuh bantuan petugas",
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: replyText,
          createdAt: Date.now(),
        },
      ]);
    } catch {
      setQuickReplies(localReply.quickReplies);
      setWaEscalationEnabled(true);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: localReply.text,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans antialiased">
      {open && (
        <div
          ref={panelRef}
          className="mb-4 w-[340px] sm:w-[380px] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in-20"
        >
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Asisten Kelurahan Cibubur</div>
                <div className="text-xs text-blue-100">Online & Siap Membantu</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => refreshChat()}
                className="hover:bg-blue-700 p-1 rounded transition"
                aria-label="Refresh chat"
                disabled={sending}
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm("Hapus chat dan mulai ulang?");
                  if (!ok) return;
                  clearChat();
                }}
                className="hover:bg-blue-700 p-1 rounded transition"
                aria-label="Hapus chat"
                disabled={sending}
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:bg-blue-700 p-1 rounded transition"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={
                      "max-w-[85%] px-4 py-3 shadow-sm text-sm " +
                      (isUser
                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none")
                    }
                  >
                    <div className="whitespace-pre-line leading-relaxed break-words">{m.text}</div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 shadow-sm text-sm bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none">
                  Mengetik...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="mb-2 overflow-x-auto">
              <div className="flex gap-2 w-max">
                {quickReplies.map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white"
                    onClick={() => submit(q)}
                    disabled={sending || !profileReady}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>

            {profileReady && waEscalationEnabled && ADMIN_WA_NUMBER && (
              <div className="mb-2">
                <Button
                  type="button"
                  className="w-full rounded-full"
                  onClick={() => openWhatsApp(messages.slice(-1)[0]?.text || "")}
                  disabled={sending}
                >
                  Hubungi Admin via WhatsApp
                </Button>
              </div>
            )}

            {!profileReady ? (
              <div className="space-y-2">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="bg-white"
                  disabled={sending}
                />
                <div className="flex gap-2">
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Nomor WhatsApp"
                    className="flex-1 bg-white"
                    disabled={sending}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const n = profileName.trim();
                      const p = profilePhone.trim();
                      if (!n || !isValidPhone(p)) return;
                      setProfile({ name: n, phone: p });
                      setQuickReplies(DEFAULT_QUICK_REPLIES);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: makeId(),
                          role: "assistant",
                          text: `Terima kasih, Bapak/Ibu ${n}, ada yang bisa kami bantu?`,
                          createdAt: Date.now(),
                        },
                      ]);
                    }}
                    disabled={!profileName.trim() || !isValidPhone(profilePhone.trim())}
                    className="rounded-full"
                  >
                    Mulai
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = input;
                  setInput("");
                  submit(v);
                }}
                className="flex gap-2 items-center bg-gray-100 p-1 rounded-full pl-4 focus-within:ring-2 ring-blue-500/50 transition"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan Anda..."
                  className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-700 placeholder:text-gray-400"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-full transition"
                  aria-label="Kirim"
                >
                  <Send size={18} className={input.trim() ? "-translate-x-0.5 translate-y-0.5" : ""} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${open ? "bg-gray-600 rotate-90" : "bg-blue-600 hover:scale-110 rotate-0"} text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center`}
        aria-label={open ? "Tutup" : "Buka"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
