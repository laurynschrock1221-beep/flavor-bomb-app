import { useState, useRef } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, PanResponder, Animated, Dimensions,
} from 'react-native'
import { supabase }         from '../../../lib/supabase'
import { useRecipes, useMealPlan, useMacros, getWeekStart, slotDate, getTargetsForDayType, calcRecipeMacros } from '@flavor-bomb/shared'
import type { Recipe, MealType, DayType } from '@flavor-bomb/shared'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const { width: SCREEN_W } = Dimensions.get('window')

export default function PlannerScreen() {
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [selected,  setSelected]  = useState<{ day: number; meal: MealType } | null>(null)

  const { recipes }                     = useRecipes(supabase)
  const { userSettings, targets }       = useMacros(supabase)
  const { plan, loading, addRecipeToSlot, removeRecipeFromSlot, setDayType, getDayType } =
    useMealPlan(supabase, weekStart)

  const recipeMap = new Map((recipes ?? []).map((r: Recipe) => [r.id, r]))

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  async function pickRecipe(recipe: Recipe) {
    if (!selected) return
    const date    = slotDate(weekStart, selected.day)
    const dayType = getDayType(date)
    await addRecipeToSlot(selected.day, selected.meal, recipe.id, dayType)
    setSelected(null)
  }

  return (
    <View style={s.container}>
      {/* Week nav */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={prevWeek} style={s.navBtn}><Text style={s.navBtnText}>←</Text></TouchableOpacity>
        <Text style={s.weekLabel}>
          {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(slotDate(weekStart, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={nextWeek} style={s.navBtn}><Text style={s.navBtnText}>→</Text></TouchableOpacity>
      </View>

      {/* 7-day scrollable grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const date    = slotDate(weekStart, i)
            const dayType = getDayType(date)
            const daySlots = (plan?.slots ?? []).filter(sl => sl.day === i)
            const dayMacros = daySlots.reduce((acc, sl) => {
              const r = recipeMap.get(sl.recipe_id)
              if (!r) return acc
              const m = calcRecipeMacros(r)
              return { p: acc.p+m.p, c: acc.c+m.c, f: acc.f+m.f, kcal: acc.kcal+m.kcal }
            }, { p:0, c:0, f:0, kcal:0 })
            const tgt = userSettings ? getTargetsForDayType(userSettings, dayType) : { kcal: 0, p: 0, c: 0, f: 0 }
            const calPct = tgt.kcal > 0 ? Math.min(100, Math.round((dayMacros.kcal / tgt.kcal) * 100)) : 0

            return (
              <View key={i} style={{ width: 130 }}>
                {/* Day header */}
                <Text style={s.dayLabel}>{DAY_LABELS[i]}</Text>
                <Text style={s.dateLabel}>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>

                {/* Day type toggle (compact) */}
                <View style={s.dayTypeRow}>
                  {(['rest','moderate','high'] as DayType[]).map(dt => (
                    <TouchableOpacity
                      key={dt}
                      onPress={() => setDayType(date, dt)}
                      style={[s.dtBtn, dayType === dt && s.dtBtnActive]}
                    >
                      <Text style={[s.dtText, dayType === dt && s.dtTextActive]}>
                        {dt === 'rest' ? 'R' : dt === 'moderate' ? 'M' : 'T'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Meal slots */}
                {MEAL_TYPES.map(meal => {
                  const slot   = daySlots.find(sl => sl.meal_type === meal)
                  const recipe = slot ? recipeMap.get(slot.recipe_id) : undefined
                  const isSelected = selected?.day === i && selected?.meal === meal

                  return (
                    <TouchableOpacity
                      key={meal}
                      onPress={() => setSelected(isSelected ? null : { day: i, meal })}
                      style={[s.slot, isSelected && s.slotSelected, recipe && s.slotFilled]}
                    >
                      <Text style={s.slotMeal}>{meal}</Text>
                      {recipe ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 14 }}>{recipe.emoji ?? '🍽️'}</Text>
                          <Text style={s.slotName} numberOfLines={1}>{recipe.name}</Text>
                        </View>
                      ) : (
                        <Text style={s.slotEmpty}>+ add</Text>
                      )}
                    </TouchableOpacity>
                  )
                })}

                {/* Calorie bar */}
                <View style={{ marginTop: 4 }}>
                  <Text style={s.calText}>{Math.round(dayMacros.kcal)} / {Math.round(tgt.kcal)} kcal</Text>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${calPct}%` as `${number}%`, backgroundColor: calPct > 110 ? '#C1440E' : '#2C6E49' }]} />
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Recipe picker */}
      {selected && (
        <View style={s.picker}>
          <Text style={s.pickerTitle}>
            Pick recipe — {DAY_LABELS[selected.day]} {selected.meal}
          </Text>
          <FlatList
            data={recipes}
            keyExtractor={r => r.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            renderItem={({ item }) => {
              const m = calcRecipeMacros(item)
              return (
                <TouchableOpacity style={s.pickCard} onPress={() => pickRecipe(item)}>
                  <Text style={{ fontSize: 22 }}>{item.emoji ?? '🍽️'}</Text>
                  <Text style={s.pickCardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.pickCardMacro}>{Math.round(m.p)}g P · {Math.round(m.kcal)} kcal</Text>
                </TouchableOpacity>
              )
            }}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fdf6ec' },
  weekNav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 12 },
  navBtn:       { padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#ede8e0' },
  navBtnText:   { fontSize: 14, fontWeight: '700' },
  weekLabel:    { fontSize: 13, fontWeight: '600', color: '#333' },
  dayLabel:     { fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 1 },
  dateLabel:    { fontSize: 10, color: '#aaa', textAlign: 'center', marginBottom: 4 },
  dayTypeRow:   { flexDirection: 'row', gap: 2, marginBottom: 6, justifyContent: 'center' },
  dtBtn:        { width: 28, height: 22, borderRadius: 6, backgroundColor: '#f0e8de', alignItems: 'center', justifyContent: 'center' },
  dtBtnActive:  { backgroundColor: '#C1440E' },
  dtText:       { fontSize: 9, fontWeight: '600', color: '#888' },
  dtTextActive: { color: '#fff' },
  slot:         { borderWidth: 1.5, borderColor: '#ede8e0', borderStyle: 'dashed', borderRadius: 8, padding: 6, marginBottom: 4, backgroundColor: '#fdf6ec', minHeight: 48 },
  slotSelected: { borderColor: '#C1440E', borderStyle: 'solid', backgroundColor: '#fff3ef' },
  slotFilled:   { borderStyle: 'solid', borderColor: '#e0d9d0', backgroundColor: '#fff' },
  slotMeal:     { fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  slotName:     { fontSize: 10, fontWeight: '600', color: '#333', flex: 1 },
  slotEmpty:    { fontSize: 11, color: '#ddd', textAlign: 'center', paddingTop: 4 },
  calText:      { fontSize: 9, color: '#aaa', marginBottom: 3 },
  barBg:        { height: 3, backgroundColor: '#e8e2d9', borderRadius: 2 },
  barFill:      { height: '100%', borderRadius: 2 },
  picker:       { flex: 1, backgroundColor: '#fff', borderTopWidth: 1.5, borderTopColor: '#ede8e0' },
  pickerTitle:  { fontSize: 13, fontWeight: '700', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0ebe3', textTransform: 'capitalize' },
  pickCard:     { flex: 1, backgroundColor: '#fdf6ec', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#ede8e0' },
  pickCardName: { fontSize: 12, fontWeight: '600', marginTop: 4, color: '#1a1a1a' },
  pickCardMacro:{ fontSize: 10, color: '#aaa', marginTop: 2 },
})
