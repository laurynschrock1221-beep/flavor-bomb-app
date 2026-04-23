'use client'
import { useState, useEffect, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserSettings, UserMacroTargets, MacroSet, DayType } from '../types'
import { getTargetsForDayType, getAllTargets } from '../lib/macroCalc'
import { USER_SETTINGS_COLUMNS, recipesDb } from '../lib/supabaseClient'

export function useMacros(supabase: SupabaseClient) {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [targets, setTargets]           = useState<UserMacroTargets | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data, error: err } = await supabase
        .from('user_settings')
        .select(USER_SETTINGS_COLUMNS)
        .eq('user_id', user.id)
        .single()
      if (cancelled) return
      if (err) { setError(err.message); setLoading(false); return }
      const settings = data as UserSettings
      setUserSettings(settings)
      setTargets(getAllTargets(settings))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  /**
   * Returns macro targets for a given date.
   * Checks recipes.planned_day_types first; falls back to 'moderate'.
   */
  const getTargetsForDay = useCallback(async (date: string): Promise<MacroSet> => {
    if (!userSettings) return { p: 0, c: 0, f: 0, kcal: 0 }
    const { data } = await recipesDb(supabase)
      .from('planned_day_types').select('day_type').eq('date', date).maybeSingle()
    const dayType: DayType = (data as { day_type?: DayType } | null)?.day_type ?? 'moderate'
    return getTargetsForDayType(userSettings, dayType)
  }, [supabase, userSettings])

  return { userSettings, targets, loading, error, getTargetsForDay }
}
