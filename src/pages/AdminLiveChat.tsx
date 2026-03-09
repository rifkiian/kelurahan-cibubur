import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, User } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/utils/supabase";
import { toast } from "@/hooks/use-toast";

type Message = {
  id: number;
  content: string;
  role: "user" | "admin";
  created_at: string;
};

type ChatProfile = {
  name: string;
  phone: string;
};

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

export default function AdminLiveChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const supabase = getSupabase();

  const [messages, setMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.from("messages").select("*").order("created_at");
      if (cancelled) return;
      if (error) return;
      if (data) setMessages(data as Message[]);
    })();

    const channel = supabase
      .channel("realtime-admin-live-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => [...prev, next]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase belum dikonfigurasi");
      const content = replyInput.trim();
      if (!content) return;
      setReplyInput("");
      const { error } = await supabase.from("messages").insert([{ content, role: "admin" }]);
      if (error) throw new Error(error.message);
    },
    onError: (e) => {
      toast({
        title: "Gagal",
        description: e instanceof Error ? e.message : "Gagal mengirim",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-20" : "ml-64",
        )}
      >
        <header className="sticky top-0 z-40 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Live Chat</h1>
              <p className="text-muted-foreground text-sm">Memantau percakapan masuk</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {!supabase ? (
            <div className="glass-card p-6">
              <div className="text-sm text-destructive">Supabase belum dikonfigurasi.</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Tambahkan env: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY lalu restart Vite.
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="glass-card p-0 overflow-hidden">
                <div className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                    {messages.map((msg) => {
                      const isUser = msg.role === "user";
                      const decoded = isUser ? decodeUserContent(msg.content) : null;
                      const displayText = isUser
                        ? decoded?.displayText || ""
                        : stripBotPrefix(msg.content);
                      const profile = isUser ? decoded?.profile || null : null;
                      return (
                        <div key={msg.id} className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}>
                          <div className={`flex gap-3 max-w-2xl ${isUser ? "flex-row" : "flex-row-reverse"}`}>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isUser ? "bg-gray-200 text-gray-600" : "bg-indigo-100 text-indigo-600"
                              }`}
                            >
                              {isUser ? <User size={20} /> : <Bot size={20} />}
                            </div>

                            <div className="flex flex-col gap-1">
                              {isUser && profile ? (
                                <div className="text-xs text-muted-foreground">
                                  {profile.name} · {profile.phone}
                                </div>
                              ) : null}
                              <div
                                className={`p-4 shadow-sm text-[15px] leading-relaxed ${
                                  isUser
                                    ? "bg-white border border-gray-200 rounded-2xl rounded-tl-none text-gray-800"
                                    : "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                                }`}
                              >
                                {displayText}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>

                  <div className="bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                      <div className="relative rounded-2xl border border-gray-300 shadow-sm overflow-hidden focus-within:ring-2 ring-indigo-500 transition bg-white">
                        <Textarea
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          placeholder="Tulis balasan manual di sini..."
                          className="w-full resize-none outline-none p-4 text-gray-700 min-h-[80px] font-sans border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => sendReplyMutation.mutate()}
                          disabled={!replyInput.trim() || sendReplyMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                        >
                          Kirim Balasan <Send size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
