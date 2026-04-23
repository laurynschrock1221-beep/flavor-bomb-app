import { useState } from 'react'
import { FlatList, Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, Link } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useRecipes, calcRecipeMacros } from '@flavor-bomb/shared'
import type { Recipe, MealType } from '@flavor-bomb/shared'

const MEAL_TYPES: (MealType | '')[] = ['', 'breakfast', 'lunch', 'dinner', 'snack', 'side']

export default function RecipesScreen() {
  const router = useRouter()
  const [search,   setSearch]   = useState('')
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [isGF,     setIsGF]     = useState(false)

  const { recipes, loading, error } = useRecipes(supabase, {
    search:   search || undefined,
    mealType: mealType || undefined,
    gfOnly:   isGF || undefined,
  })

  if (loading) return <View style={s.center}><ActivityIndicator color="#C1440E" /></View>
  if (error)   return <View style={s.center}><Text style={s.error}>{error}</Text></View>

  return (
    <View style={s.container}>
      {/* Search + import */}
      <View style={s.topRow}>
        <TextInput
          style={[s.search, { flex: 1 }]}
          placeholder="Search recipes…"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <Link href="/(tabs)/recipes/import" asChild>
          <TouchableOpacity style={s.importBtn}>
            <Text style={s.importBtnText}>📸</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Meal type + GF chips */}
      <View style={s.chips}>
        {MEAL_TYPES.map(t => (
          <TouchableOpacity key={t || 'all'} onPress={() => setMealType(t)}
            style={[s.chip, mealType === t && s.chipActive]}>
            <Text style={[s.chipText, mealType === t && s.chipTextActive]}>
              {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setIsGF(v => !v)} style={[s.chip, isGF && { ...s.chipActive, backgroundColor: '#2C6E49', borderColor: '#2C6E49' }]}>
          <Text style={[s.chipText, isGF && s.chipTextActive]}>🌿 GF</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => <RecipeListCard recipe={item} onPress={() => router.push(`/(tabs)/recipes/${item.id}`)} />}
        ListEmptyComponent={<Text style={s.empty}>No recipes found.</Text>}
      />
    </View>
  )
}

function RecipeListCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const macros = calcRecipeMacros(recipe)
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.emoji}>{recipe.emoji ?? '🍽️'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle} numberOfLines={1}>{recipe.name}</Text>
          <Text style={s.cardSub}>{[recipe.cuisine, recipe.meal_type].filter(Boolean).join(' · ')}</Text>
        </View>
        {recipe.is_gf && <Text style={s.gfBadge}>GF</Text>}
      </View>
      <View style={s.macroRow}>
        {[
          { label: 'Protein', value: Math.round(macros.p),    color: '#C1440E' },
          { label: 'Carbs',   value: Math.round(macros.c),    color: '#888' },
          { label: 'Fat',     value: Math.round(macros.f),    color: '#888' },
          { label: 'kcal',    value: Math.round(macros.kcal), color: '#888' },
        ].map(m => (
          <View key={m.label} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: m.color }}>{m.value}</Text>
            <Text style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fdf6ec', padding: 12 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error:        { color: '#C1440E' },
  topRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  search:       { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ede8e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  importBtn:    { width: 44, height: 44, backgroundColor: '#C1440E', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  importBtnText:{ fontSize: 20 },
  chips:        { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5, borderColor: '#ede8e0', backgroundColor: '#fff' },
  chipActive:   { backgroundColor: '#C1440E', borderColor: '#C1440E' },
  chipText:     { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  chipTextActive:{ color: '#fff', fontWeight: '600' },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emoji:        { fontSize: 26 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardSub:      { fontSize: 11, color: '#aaa', marginTop: 1, textTransform: 'capitalize' },
  gfBadge:      { fontSize: 10, backgroundColor: '#e8f5ee', color: '#2C6E49', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, fontWeight: '700' },
  macroRow:     { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f5f0e8', paddingTop: 8 },
  empty:        { textAlign: 'center', color: '#aaa', paddingTop: 40 },
})
