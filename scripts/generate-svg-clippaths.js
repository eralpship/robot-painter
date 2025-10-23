#!/usr/bin/env node

/**
 * Generates clipPath definitions from stencil_* paths in the SVG
 * Run with: node scripts/generate-svg-clippaths.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SVG_PATH = join(__dirname, '../src/components/texture-editor/paintable_uv.svg')

function generateClipPaths() {
  const svgContent = readFileSync(SVG_PATH, 'utf-8')

  // Define the stencil labels to extract
  const stencilLabels = [
    'stencil_back',
    'stencil_lid',
    'stencil_left',
    'stencil_right',
    'stencil_front'
  ]
  const stencilPaths = []

  // Extract path data for each stencil label
  for (const fullLabel of stencilLabels) {
    const label = fullLabel.replace('stencil_', '')
    const pathElementRegex = new RegExp(
      `<path[^>]*inkscape:label="${fullLabel}"[\\s\\S]*?/>`,
      'i'
    )
    const pathElement = svgContent.match(pathElementRegex)

    if (pathElement) {
      const dMatch = pathElement[0].match(/d="([^"]+)"/)
      if (dMatch) {
        stencilPaths.push({ label, pathData: dMatch[1] })
      }
    }
  }

  if (stencilPaths.length === 0) {
    console.log('No stencil_* paths found in SVG')
    return
  }

  console.log(`Found ${stencilPaths.length} stencil paths:`, stencilPaths.map(p => p.label))

  // Generate clipPath elements
  const clipPathsXml = stencilPaths.map(({ label, pathData }) => {
    return `    <clipPath id="clip-${label}">
      <path d="${pathData}" />
    </clipPath>`
  }).join('\n')

  // Find the <defs> section and insert clipPaths
  const defsRegex = /(<defs[^>]*>)([\s\S]*?)(<\/defs>)/
  const defsMatch = svgContent.match(defsRegex)

  if (!defsMatch) {
    console.error('Could not find <defs> section in SVG')
    return
  }

  // Remove existing clipPath elements from defs
  let defsContent = defsMatch[2]
  defsContent = defsContent.replace(/<clipPath[^>]*>[\s\S]*?<\/clipPath>\n?/g, '')

  // Add new clipPaths
  const updatedDefs = `${defsMatch[1]}${defsContent}\n${clipPathsXml}\n  ${defsMatch[3]}`

  const updatedSvg = svgContent.replace(defsRegex, updatedDefs)

  // Write back to file
  writeFileSync(SVG_PATH, updatedSvg, 'utf-8')

  console.log('✓ Generated clipPaths for:', stencilPaths.map(p => `clip-${p.label}`).join(', '))
}

generateClipPaths()
