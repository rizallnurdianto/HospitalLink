/**
 * Normalisasi nomor telepon/WhatsApp Indonesia menjadi digit E.164 polos
 * ("62812xxxxxxx"); menerima "0812…", "+62 812…", "62812…", "812…".
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return `62${digits.slice(1)}`
  if (digits.startsWith("62")) return digits
  if (digits.startsWith("8")) return `62${digits}`
  return digits
}

/** Deep link wa.me, opsional dengan pesan yang sudah terisi. */
export function whatsAppHref(phone: string, message?: string): string {
  const num = toWhatsAppNumber(phone)
  return message
    ? `https://wa.me/${num}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${num}`
}
