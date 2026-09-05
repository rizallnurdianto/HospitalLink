// Kelas rumah sakit sesuai Permenkes; A / B / C / D. Ditentukan admin
// berdasarkan fasilitas, kapasitas tempat tidur, cakupan spesialis, dan
// kemampuan layanan. Disimpan sebagai teks bebas di `hospitals.hospital_class` ("" = belum diisi).

export const HOSPITAL_CLASSES = ["A", "B", "C", "D"] as const

export type HospitalClass = typeof HOSPITAL_CLASSES[number]

/** Deskripsi satu baris arti masing-masing kelas. */
export const HOSPITAL_CLASS_INFO: Record<HospitalClass, string> = {
  A: "Pelayanan medik spesialis luas dan subspesialis, rujukan tertinggi (sekitar 250 tempat tidur atau lebih).",
  B: "Spesialis luas dan sebagian subspesialis, rujukan regional (sekitar 200 tempat tidur atau lebih).",
  C: "Empat spesialis dasar beserta penunjang (sekitar 100 tempat tidur atau lebih).",
  D: "Pelayanan medik dasar (sekitar 50 tempat tidur atau lebih).",
}

export function classLabel(value: string): string {
  return value ? `Kelas ${value}` : "Kelas belum tercantum"
}
