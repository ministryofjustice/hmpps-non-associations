const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

/**
 * Normal display form of a person’s name (often a prisoner)
 * { "firstName": "DAVID", "lastName": "JONES", … } → "David Jones"
 */
export const nameOfPerson = (prisoner: { firstName: string; lastName: string }): string =>
  `${convertToTitleCase(prisoner.firstName)} ${convertToTitleCase(prisoner.lastName)}`.trim()

/**
 * Display form of a person’s name (often a prisoner) for lists and tables
 * { "firstName": "DAVID", "lastName": "JONES", … } → "Jones, David"
 */
export const reversedNameOfPerson = (prisoner: { firstName: string; lastName: string }): string => {
  if (!prisoner.lastName) {
    return convertToTitleCase(prisoner.firstName)
  }
  if (!prisoner.firstName) {
    return convertToTitleCase(prisoner.lastName)
  }
  return `${convertToTitleCase(prisoner.lastName)}, ${convertToTitleCase(prisoner.firstName)}`
}
