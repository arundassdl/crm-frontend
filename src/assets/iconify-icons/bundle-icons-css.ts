/**
 * This is an advanced example for creating icon bundles for Iconify SVG Framework.
 *
 * It creates a bundle from:
 * - All SVG files in a directory.
 * - Custom JSON files.
 * - Iconify icon sets.
 * - SVG framework.
 *
 * This example uses Iconify Tools to import and clean up icons.
 * For Iconify Tools documentation visit https://docs.iconify.design/tools/tools2/
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'

// Installation: npm install --save-dev @iconify/tools @iconify/utils @iconify/json @iconify/types
import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import type { IconifyJSON } from '@iconify/types'
import { getIcons, getIconsCSS, stringToIcon } from '@iconify/utils'

/**
 * Script configuration
 */
interface BundleScriptCustomSVGConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to SVG files
  dir: string

  // True if icons should be treated as monotone: colors replaced with currentColor
  monotone: boolean

  // Icon set prefix
  prefix: string
}

interface BundleScriptCustomJSONConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to JSON file
  filename: string

  // List of icons to import. If missing, all icons will be imported
  icons?: string[]
}

interface BundleScriptConfig {
  // eslint-disable-next-line lines-around-comment
  // Custom SVG to import and bundle
  svg?: BundleScriptCustomSVGConfig[]

  // Icons to bundled from @iconify/json packages
  icons?: string[]

  // List of JSON files to bundled
  // Entry can be a string, pointing to filename or a BundleScriptCustomJSONConfig object (see type above)
  // If entry is a string or object without 'icons' property, an entire JSON file will be bundled
  json?: (string | BundleScriptCustomJSONConfig)[]
}

const sources: BundleScriptConfig = {
  json: [
    // Iconify JSON file (@iconify/json is a package name, /json/ is directory where files are, then filename)
    // This will load ALL icons from ri.json.
    // If you only want specific ri- icons, you might remove this line and rely solely on the `sources.icons` list for `ri`
    require.resolve('@iconify/json/json/ri.json'),

    // Custom file with only few icons
    {
      filename: require.resolve('@iconify/json/json/line-md.json'),
      icons: ['home-twotone-alt', 'github', 'document-list', 'document-code', 'image-twotone']
    }

    // Custom JSON file
    // 'json/gg.json'
  ],

  icons: [
    'bx-basket',
    'bi-airplane-engines',
    'tabler-anchor',
    'uit-adobe-alt',
    'twemoji-auto-rickshaw',

    // Corrected Remix Icons
    'ri-reject-line',          // Was correct
    'ri-check-line',           // Corrected from 'ri-tick-line'
    'ri-redeem-line',          // Was correct
    'ri-checkbox-circle-line', // Corrected from 'ri-tick-circle-outline'
    'ri-rewards-line',         // Was correct
    'ri-loader-4-line'         // Chosen as a replacement for 'ri-pending-line' (common spinner)
    // Alternative for pending: 'ri-time-line', 'ri-hourglass-2-line', 'ri-refresh-line'
  ],

  svg: [
    /* {
      dir: 'src/assets/iconify-icons/svg',
      monotone: false,
      prefix: 'custom'
    } */
    /* {
      dir: 'src/assets/iconify-icons/emojis',
      monotone: false,
      prefix: 'emoji'
    } */
  ]
}

// File to save bundle to
const target = join(__dirname, 'generated-icons.css')

/**
 * Do stuff!
 */

;(async function () {
  // Create directory for output if missing
  const dir = dirname(target)

  try {
    await fs.mkdir(dir, {
      recursive: true
    })
  } catch (err) {
    // Directory already exists or other error (ignored for simplicity in this script)
  }

  const allIcons: IconifyJSON[] = []

  /**
   * Convert sources.icons to sources.json entries
   * This ensures that specific icons listed in sources.icons are loaded
   * by creating new entries in the sources.json array.
   */
  if (sources.icons && sources.icons.length > 0) {
    const sourcesJSON = sources.json ? sources.json : (sources.json = [])

    // Sort icons by prefix
    const organizedList = organizeIconsList(sources.icons)

    for (const prefix in organizedList) {
      try {
        const filename = require.resolve(`@iconify/json/json/${prefix}.json`)
        sourcesJSON.push({
          filename,
          icons: organizedList[prefix]
        })
      } catch (err) {
        console.warn(`Could not resolve JSON for prefix ${prefix} from sources.icons. Skipping. Error: ${err}`)
      }
    }
  }

  /**
   * Bundle JSON files and collect icons
   */
  if (sources.json) {
    for (let i = 0; i < sources.json.length; i++) {
      const item = sources.json[i]

      // Load icon set
      const filename = typeof item === 'string' ? item : item.filename
      let content: IconifyJSON | undefined
      try {
        content = JSON.parse(await fs.readFile(filename, 'utf8')) as IconifyJSON
      } catch (err) {
        console.error(`Error reading or parsing JSON file ${filename}:`, err)
        continue // Skip this item
      }

      if (!content) {
        console.error(`Could not load content from ${filename}`)
        continue
      }

      // Filter icons if an icon list is specified
      if (typeof item !== 'string' && item.icons?.length) {
        const filteredContent = getIcons(content, item.icons)

        if (!filteredContent) {
          // Log which icons were not found for better debugging
          const notFound: string[] = []
          for (const iconName of item.icons) {
            if (!content.icons[iconName] && !(content.aliases && content.aliases[iconName])) {
              notFound.push(iconName)
            }
          }
          console.error(
            `Cannot find required icons in ${filename}. Missing: ${notFound.join(', ') || 'unknown (please check list)'}`
          )
          // Optionally, you could choose to continue without throwing an error,
          // or throw it as originally:
          // throw new Error(`Cannot find required icons in ${filename}. Missing: ${notFound.join(', ')}`);
          continue // Skip this item if icons are missing
        }

        // Collect filtered icons
        allIcons.push(filteredContent)
      } else {
        // Collect all icons from the JSON file
        allIcons.push(content)
      }
    }
  }

  /**
   * Bundle custom SVG icons and collect icons
   */
  if (sources.svg) {
    for (let i = 0; i < sources.svg.length; i++) {
      const source = sources.svg[i]

      // Import icons
      let iconSet: any // Type according to importDirectory if available, 'any' for simplicity here
      try {
        iconSet = await importDirectory(source.dir, {
          prefix: source.prefix
        })
      } catch (err) {
        console.error(`Error importing directory ${source.dir}:`, err)
        continue
      }

      // Validate, clean up, fix palette, etc.
      await iconSet.forEach(async (name: string, type: string) => {
        if (type !== 'icon') return

        // Get SVG instance for parsing
        const svg = iconSet.toSVG(name)

        if (!svg) {
          // Invalid icon
          iconSet.remove(name)
          return
        }

        // Clean up and optimise icons
        try {
          // Clean up icon code
          await cleanupSVG(svg)

          if (source.monotone) {
            // Replace color with currentColor, add if missing
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => {
                return !color || isEmptyColor(color) ? colorStr : 'currentColor'
              }
            })
          }

          // Optimise
          await runSVGO(svg)
        } catch (err) {
          // Invalid icon
          console.error(`Error parsing ${name} from ${source.dir}:`, err)
          iconSet.remove(name)
          return
        }

        // Update icon from SVG instance
        iconSet.fromSVG(name, svg)
      })

      // Collect the SVG icon
      allIcons.push(iconSet.export())
    }
  }

  // Generate CSS from collected icons
  // Ensure allIcons actually contains icon sets before processing
  if (allIcons.length > 0) {
    const cssContent = allIcons
      .filter(iconSet => iconSet && iconSet.icons && Object.keys(iconSet.icons).length > 0) // Ensure iconSet is valid and has icons
      .map(iconSet => {
        try {
          return getIconsCSS(iconSet, Object.keys(iconSet.icons), { iconSelector: '.{prefix}-{name}' })
        } catch (e) {
          console.warn(`Could not generate CSS for an icon set (prefix: ${iconSet.prefix || 'unknown'}):`, e)
          return ''
        }
      })
      .join('\n')

    // Save the CSS to a file
    await fs.writeFile(target, cssContent, 'utf8')
    console.log(`Saved CSS to ${target}! (${allIcons.length} icon set(s) processed)`)
  } else {
    console.warn('No icons were collected. CSS file will be empty or not created.')
    // Optionally create an empty file or just log
    await fs.writeFile(target, '/* No icons were bundled. */', 'utf8')
  }
})().catch(err => {
  console.error('Unhandled error in script:', err)
  process.exit(1) // Exit with an error code
})

/**
 * Sort icon names by prefix
 */
function organizeIconsList(icons: string[]): Record<string, string[]> {
  const sorted: Record<string, string[]> = Object.create(null)

  icons.forEach(icon => {
    const item = stringToIcon(icon)

    if (!item) {
      console.warn(`Invalid icon name format: ${icon}`)
      return
    }

    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])
    const name = item.name

    if (!prefixList.includes(name)) {
      prefixList.push(name)
    }
  })

  return sorted
}
