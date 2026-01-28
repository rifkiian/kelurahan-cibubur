import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

export function ComplaintForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<string | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [trackCode, setTrackCode] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<{
    id: string;
    status: string;
    category: string;
    createdAt: string;
    updatedAt: string;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "File harus berupa gambar (JPG, PNG)", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({ title: "Error", description: "Ukuran file maksimal 2MB", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      return data.url || null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const statusLabel = (status: string) => {
    if (status === "BARU") return "Menunggu";
    if (status === "DIPROSES") return "Diproses";
    if (status === "SELESAI") return "Selesai";
    return status;
  };

  const adminFocusLink = useMemo(() => {
    if (!lastSubmittedId) return "";
    const sp = new URLSearchParams();
    sp.set("focus", lastSubmittedId);
    return `/admin/pengaduan?${sp.toString()}`;
  }, [lastSubmittedId]);

  return (
    <section className="py-12 bg-white" id="pengaduan">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Form Pengaduan Masyarakat</h2>
            <p className="text-gray-600">Sampaikan keluhan atau masukan Anda untuk perbaikan pelayanan</p>
          </div>
          
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                let photoUrl: string | null = null;
                
                // Upload file if selected
                if (selectedFile) {
                  setUploading(true);
                  photoUrl = await uploadFile(selectedFile);
                  setUploading(false);
                  
                  if (!photoUrl) {
                    toast({ 
                      title: "Error", 
                      description: "Gagal mengupload foto, silakan coba lagi", 
                      variant: "destructive" 
                    });
                    return;
                  }
                }

                const res = await fetch("/api/pengaduan", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    phone,
                    category,
                    location,
                    description,
                    photoUrl,
                  }),
                });

                const data = (await res.json().catch(() => ({}))) as {
                  message?: string;
                  item?: { id?: string; status?: string };
                };

                if (!res.ok) {
                  throw new Error(data.message || "Gagal mengirim pengaduan");
                }

                setLastSubmittedId(data.item?.id ?? null);
                setLastSubmittedStatus(data.item?.status ?? "BARU");

                setName("");
                setPhone("");
                setCategory("");
                setLocation("");
                setDescription("");
                clearFile();
                toast({ title: "Berhasil", description: "Pengaduan berhasil dikirim." });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Gagal mengirim pengaduan";
                toast({ title: "Gagal", description: msg, variant: "destructive" });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <Input id="name" placeholder="Nama Anda" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                <Input id="phone" type="tel" placeholder="0812-3456-7890" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori Pengaduan</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infrastruktur">Infrastruktur Jalan</SelectItem>
                  <SelectItem value="sampah">Pengelolaan Sampah</SelectItem>
                  <SelectItem value="keamanan">Gangguan Keamanan</SelectItem>
                  <SelectItem value="administrasi">Pelayanan Administrasi</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lokasi Kejadian</label>
              <Input id="location" placeholder="Contoh: Jl. Melati No. 10, RT 05/RW 02" required value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi Pengaduan</label>
              <Textarea 
                id="description" 
                placeholder="Jelaskan keluhan Anda secara rinci..." 
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lampiran Foto (Opsional)</label>
              
              {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                    disabled={submitting || uploading}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Klik untuk upload</span> atau drag and drop
                    </div>
                    <div className="text-xs text-gray-500 mt-1">JPG, PNG (maks. 2MB)</div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full max-w-sm rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearFile}
                    disabled={submitting || uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={submitting || uploading || !category}>
                {submitting || uploading ? "Mengirim..." : "Kirim Pengaduan"}
              </Button>
            </div>

            {lastSubmittedStatus && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-700">
                  Status pengaduan kamu: <span className="font-semibold">{statusLabel(lastSubmittedStatus)}</span>
                </div>
                {lastSubmittedId ? (
                  <div className="mt-3">
                    <div className="text-sm text-gray-700">Kode Pengaduan:</div>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-mono text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 break-all">
                        {lastSubmittedId}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(lastSubmittedId);
                              toast({ title: "Tersalin", description: "Kode pengaduan berhasil disalin." });
                            } catch {
                              toast({
                                title: "Gagal",
                                description: "Tidak bisa menyalin otomatis. Salin manual dari kode di atas.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Salin Kode
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Simpan kode ini untuk cek perkembangan pengaduan. Admin bisa mencari kode ini di halaman Pengaduan.
                      {adminFocusLink ? ` (Admin link: ${adminFocusLink})` : ""}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="pt-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="font-semibold text-gray-900">Cek Perkembangan Pengaduan</div>
                <div className="mt-1 text-sm text-gray-600">Masukkan kode pengaduan yang kamu terima setelah mengirim.</div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Masukkan kode pengaduan"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={!trackCode.trim() || trackLoading}
                    onClick={async () => {
                      const code = trackCode.trim();
                      if (!code) return;
                      setTrackLoading(true);
                      setTrackResult(null);
                      try {
                        const res = await fetch(`/api/pengaduan/track/${encodeURIComponent(code)}`);
                        const data = (await res.json().catch(() => ({}))) as {
                          message?: string;
                          item?: {
                            id: string;
                            status: string;
                            category: string;
                            createdAt: string;
                            updatedAt: string;
                          };
                        };
                        if (!res.ok) {
                          throw new Error(data.message || "Kode tidak ditemukan");
                        }
                        if (!data.item) throw new Error("Kode tidak ditemukan");
                        setTrackResult(data.item);
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : "Gagal cek status";
                        toast({ title: "Gagal", description: msg, variant: "destructive" });
                      } finally {
                        setTrackLoading(false);
                      }
                    }}
                  >
                    Cek Status
                  </Button>
                </div>

                {trackResult ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-700">
                      Kode: <span className="font-mono">{trackResult.id}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      Kategori: <span className="font-semibold capitalize">{trackResult.category}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      Status: <span className="font-semibold">{statusLabel(trackResult.status)}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Terakhir diperbarui: {new Date(trackResult.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
