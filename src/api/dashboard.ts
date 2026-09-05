import { supabase } from "../lib/supabase"
import type { ActivityLog } from "../types/db"

export type AdminStats = {
  hospitalsTotal: number
  hospitalsActive: number
  hospitalsInactive: number
  patients: number
  admins: number
  /** akun pengguna yang dibuat dalam 7 hari terakhir */
  usersNew7d: number
}

async function runCount(
  query: PromiseLike<{
    count: number | null
    error: { message: string } | null
  }>,
): Promise<number> {
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

const HEAD = { count: "exact" as const, head: true }

export async function getAdminStats(): Promise<AdminStats> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const [hospitalsTotal, hospitalsActive, patients, admins, usersNew7d] =
    await Promise.all([
      runCount(supabase.from("hospitals").select("*", HEAD)),
      runCount(
        supabase.from("hospitals").select("*", HEAD).eq("is_active", true),
      ),
      runCount(
        supabase.from("profiles").select("*", HEAD).eq("role", "patient"),
      ),
      runCount(supabase.from("profiles").select("*", HEAD).eq("role", "admin")),
      runCount(
        supabase
          .from("profiles")
          .select("*", HEAD)
          .eq("role", "patient")
          .gte("created_at", weekAgo),
      ),
    ])

  return {
    hospitalsTotal,
    hospitalsActive,
    hospitalsInactive: hospitalsTotal - hospitalsActive,
    patients,
    admins,
    usersNew7d,
  }
}

export async function getRecentActivity(limit = 12): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as ActivityLog[]
}
