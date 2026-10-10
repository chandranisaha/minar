import i18n from '../../i18n'
import en from './content/en.json'

/** Festival Showdown keeps its strings in its own `showdown` namespace. Hindi and Telugu fall back to English until their files are added. */
i18n.addResourceBundle('en', 'showdown', en, true, true)
