/**
 * Generate a LESS file with constants derived from the openbazaar-css module’s
 * theme.json file.
 */
const fs = require('fs')
const theme = require('openbazaar-css/theme')
const outputFile = 'src/styles/constants.less'

const header = `/**
 * These OpenBazaar theme constants are auto-generated from the 'openbazaar-css' module.
 * Run 'scripts/openbazaar-css-constants.js' to rebuild this file.
 */
`

const styles = Object.entries(theme).reduce((styles, [section, values]) => {
  let sectionStyles = null
  if (typeof values === 'string') {
    sectionStyles = [`@${section}: ${values};`]
  } else if (Array.isArray(values)) {
    sectionStyles = values.map((value, i) => `@${section}-${i}: ${value};`)
  } else {
    sectionStyles = Object.entries(values).map(
      ([key, value]) => `@${section}-${key}: ${value};`)
  }
  return styles.concat(sectionStyles, [''])
}, [])

fs.writeFileSync(outputFile, [header, ...styles].join('\n'))
console.log(`Generated new copy of '${outputFile}'`)
