import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter }    from 'expo-router'
import { supabase }     from '../../../lib/supabase'
import { recipesDb }    from '@flavor-bomb/shared'
import type { Recipe, Ingredient } from '@flavor-bomb/shared'

export default function ImportScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parsed,  setParsed]  = useState<(Omit<Recipe, 'id'|'user_id'|'created_at'|'updated_at'> & { ingredients: Omit<Ingredient,'id'|'recipe_id'|'created_at'>[] }) | null>(null)
  const [saving,  setSaving]  = useState(false)

  async function pickImage(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant photo access in Settings.')
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 })

    if (result.canceled || !result.assets[0]) return

    const asset   = result.assets[0]
    const base64  = asset.base64
    if (!base64) return

    setLoading(true)
    setParsed(null)

    // Call the web API route (configure base URL via env)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const blob   = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob())
    const form   = new FormData()
    form.append('image', blob as unknown as Blob, 'photo.jpg')

    const res  = await fetch(`${apiUrl}/api/parse-recipe`, { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok) {
      Alert.alert('Parse failed', json.error ?? 'Unknown error')
      setLoading(false)
      return
    }

    setParsed(json.recipe)
    setLoading(false)
  }

  async function handleSave() {
    if (!parsed) return
    setSaving(true)

    const { ingredients, ...recipeData } = parsed

    const { data: newRecipe, error: recipeErr } = await recipesDb(supabase)
      .from('recipes').insert(recipeData).select().single()

    if (recipeErr) { Alert.alert('Error', recipeErr.message); setSaving(false); return }

    if (ingredients?.length) {
      const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: (newRecipe as Recipe).id, sort_order: i }))
      await recipesDb(supabase).from('ingredients').insert(rows)
    }

    Alert.alert('Saved!', `${parsed.name} added to your recipes.`, [
      { text: 'View', onPress: () => router.push(`/(tabs)/recipes/${(newRecipe as Recipe).id}`) },
      { text: 'OK',   onPress: () => router.back() },
    ])
    setSaving(false)
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>Import a Recipe</Text>
      <Text style={s.sub}>Take a photo of a recipe or upload from your library. Claude AI will parse the ingredients and macros.</Text>

      <View style={s.buttonRow}>
        <TouchableOpacity style={s.pickBtn} onPress={() => pickImage(true)}>
          <Text style={s.pickIcon}>📷</Text>
          <Text style={s.pickLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.pickBtn} onPress={() => pickImage(false)}>
          <Text style={s.pickIcon}>🖼️</Text>
          <Text style={s.pickLabel}>Library</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.loadingBox}>
          <ActivityIndicator color="#C1440E" size="large" />
          <Text style={s.loadingText}>Parsing with Claude AI…</Text>
        </View>
      )}

      {parsed && !loading && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardEmoji}>{parsed.emoji ?? '🍽️'}</Text>
            <View>
              <Text style={s.cardName}>{parsed.name}</Text>
              <Text style={s.cardMeta}>
                {[parsed.cuisine, parsed.meal_type, parsed.cook_time].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
          {parsed.description && <Text style={s.desc}>{parsed.description}</Text>}
          <Text style={s.ingCount}>{parsed.ingredients?.length ?? 0} ingredients · {parsed.instructions?.length ?? 0} steps</Text>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Recipe'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fdf6ec', padding: 20 },
  title:       { fontFamily: 'Georgia', fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' },
  sub:         { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 28 },
  buttonRow:   { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pickBtn:     { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#ede8e0', padding: 20, alignItems: 'center' },
  pickIcon:    { fontSize: 36, marginBottom: 6 },
  pickLabel:   { fontSize: 13, fontWeight: '600', color: '#555' },
  loadingBox:  { alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },
  card:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#ede8e0', overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0ebe3' },
  cardEmoji:   { fontSize: 32 },
  cardName:    { fontFamily: 'Georgia', fontSize: 17, fontWeight: '700' },
  cardMeta:    { fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'capitalize' },
  desc:        { fontSize: 13, color: '#666', lineHeight: 20, padding: 16, paddingBottom: 8 },
  ingCount:    { fontSize: 12, color: '#aaa', paddingHorizontal: 16, paddingBottom: 16 },
  saveBtn:     { backgroundColor: '#C1440E', margin: 16, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
