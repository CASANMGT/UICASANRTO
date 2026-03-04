#!/usr/bin/env node
/**
 * One-time import of city boundaries from Peta Nusa GeoJSON files.
 *
 * 1. Download GeoJSON from https://www.petanusa.web.id/ for each city
 * 2. Save files in scripts/geofence-import/ with names: jakarta.geojson, bekasi.geojson, etc.
 * 3. Run: npm run import:geofence
 *
 * See scripts/geofence-import/README.md for download instructions.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMPORT_DIR = join(__dirname, 'geofence-import')
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'cityPolygons.json')

const FILENAME_TO_CITY = {
  jakarta: 'Jakarta',
  bekasi: 'Bekasi',
  kabupaten_bekasi: 'Kabupaten Bekasi',
  kota_bekasi: 'Kota Bekasi',
  'kota_bekasi_32.75': 'Kota Bekasi',
  depok: 'Depok',
  tangerang: 'Tangerang',
  tangerang_selatan: 'Tangerang Selatan',
  bogor: 'Bogor',
  kabupaten_bogor: 'Kabupaten Bogor',
  kota_bogor: 'Kota Bogor',
  kabupaten_purwakarta: 'Kabupaten Purwakarta',
  purwakarta: 'Kabupaten Purwakarta',
  'kabupaten_purwakarta_32.14': 'Kabupaten Purwakarta',
  kabupaten_karawang: 'Kabupaten Karawang',
  karawang: 'Kabupaten Karawang',
  'kabupaten_karawang_32.15(1)': 'Kabupaten Karawang',
  'kabupaten_bogor_32.01(1)': 'Kabupaten Bogor',
  'kota_bogor_32.71': 'Kota Bogor',
  'kabupaten_tangerang_36.03': 'Kabupaten Tangerang',
  'kota_tangerang_36.71': 'Kota Tangerang',
  'kota_tangerang_selatan_36.74': 'Tangerang Selatan',
  'kota_depok_32.76': 'Depok',
  'kota_depok_32.76(1)': 'Depok',
  bandung: 'Bandung',
  'kabupaten_bandung_barat_32.17': 'Kabupaten Bandung Barat',
  'kota_bandung_32.73': 'Kota Bandung',
  'kabupaten_bandung_32.04': 'Kabupaten Bandung',
  'kota_cimahi_32.77': 'Kota Cimahi',
  'kabupaten_sumedang_32.11': 'Kabupaten Sumedang',
  'kabupaten_subang_32.13': 'Kabupaten Subang',
  surabaya: 'Surabaya',
  semarang: 'Semarang',
  yogyakarta: 'Yogyakarta',
  medan: 'Medan',
}

function ringArea(ring) {
  if (!ring || ring.length < 3) return 0
  let area = 0
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += ring[i][0] * ring[j][1]
    area -= ring[j][0] * ring[i][1]
  }
  return Math.abs(area) / 2
}

function extractRingsFromGeometry(geom) {
  const rings = []
  if (!geom || !geom.coordinates) return rings
  if (geom.type === 'Polygon' && geom.coordinates[0]?.length >= 3) {
    rings.push(geom.coordinates[0])
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates || []) {
      if (poly[0]?.length >= 3) rings.push(poly[0])
    }
  }
  return rings
}

function parseGeoJSON(json) {
  if (!json) return null
  if (json.type === 'Feature') {
    const rings = extractRingsFromGeometry(json.geometry)
    if (rings.length === 0) return null
    if (rings.length === 1) return rings[0].map(([lng, lat]) => [lng, lat])
    return rings.map((r) => r.map(([lng, lat]) => [lng, lat]))
  }
  if (json.type === 'FeatureCollection') {
    const features = json.features || []
    const allRings = []
    for (const f of features) {
      allRings.push(...extractRingsFromGeometry(f?.geometry))
    }
    if (allRings.length === 0) return null
    if (allRings.length === 1) return allRings[0].map(([lng, lat]) => [lng, lat])
    return allRings.map((r) => r.map(([lng, lat]) => [lng, lat]))
  }
  if (json.type === 'Polygon' || json.type === 'MultiPolygon') {
    const rings = extractRingsFromGeometry(json)
    if (rings.length === 0) return null
    if (rings.length === 1) return rings[0].map(([lng, lat]) => [lng, lat])
    return rings.map((r) => r.map(([lng, lat]) => [lng, lat]))
  }
  return null
}

function main() {
  let existing = {}
  try {
    existing = JSON.parse(readFileSync(OUT_PATH, 'utf8'))
  } catch {
    console.log('No existing cityPolygons.json, starting fresh')
  }

  const files = readdirSync(IMPORT_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.geojson'))
    .map((e) => e.name)

  if (files.length === 0) {
    console.error('No .geojson files in', IMPORT_DIR)
    console.error('Download from https://www.petanusa.web.id/ and save as jakarta.geojson, bekasi.geojson, etc.')
    console.error('See scripts/geofence-import/README.md for instructions')
    process.exit(1)
  }

  const result = { ...existing }
  let imported = 0

  for (const file of files) {
    const stem = file.replace(/\.geojson$/i, '').toLowerCase()
    const city = FILENAME_TO_CITY[stem]
    if (!city) {
      console.warn('  Skip (unknown city):', file)
      continue
    }

    const path = join(IMPORT_DIR, file)
    let json
    try {
      json = JSON.parse(readFileSync(path, 'utf8'))
    } catch (e) {
      console.warn('  Skip (invalid JSON):', file, e.message)
      continue
    }

    const polygon = parseGeoJSON(json)
    if (!polygon) {
      console.warn('  Skip (no polygon):', file)
      continue
    }
    const isMulti = Array.isArray(polygon[0]) && Array.isArray(polygon[0][0])
    const ok = isMulti ? polygon.every((p) => p.length >= 3) : polygon.length >= 3
    if (!ok) {
      console.warn('  Skip (invalid polygon):', file)
      continue
    }

    result[city] = polygon
    imported++
    const desc = isMulti ? `${polygon.length} parts` : `${polygon.length} points`
    console.log('  Imported:', city, `(${desc})`)
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2))
  console.log(`\nWrote ${OUT_PATH} (${imported} cities imported, ${Object.keys(result).length} total)`)
}

main()
