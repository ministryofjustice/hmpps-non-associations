/**
 * The items provided to GOV.UK Radio and Checkbox components
 * NB: there are many more parameters
 * cf. https://design-system.service.gov.uk/components/radios/#options-stacked-radios-example--items
 * and https://design-system.service.gov.uk/components/checkboxes/#options-checkboxes-example--items
 */
type Item = { value: string } & { checked?: boolean }

/**
 * Marks items as checked depending on value for use with GOV.UK Radio and Checkbox components
 */
export function checkedItems<I extends Item>(items: I[], singleValue: string | undefined): I[] {
  return items.map(item => {
    return {
      ...item,
      checked: item.value === singleValue,
    }
  })
}

/**
 * Marks items as checked depending on values for use with GOV.UK Checkbox components
 */
export function multipleCheckedItems<I extends Item>(items: I[], multipleValues: string[] | undefined): I[] {
  return items.map(item => {
    return {
      ...item,
      checked: Boolean(multipleValues?.includes(item.value)),
    }
  })
}
