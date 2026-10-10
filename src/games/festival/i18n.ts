import i18n from '../../i18n'
import en from './content/en.json'
import hi from './content/hi.json'
import te from './content/te.json'

/** Festival Countdown keeps its strings in its own `festival` namespace; the shell's locale files stay untouched. */
for (const [lng, res] of Object.entries({ en, hi, te })) i18n.addResourceBundle(lng, 'festival', res, true, true)
