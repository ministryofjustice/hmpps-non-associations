// eslint-disable-next-line import/extensions,import/no-absolute-path,import/no-unresolved
import { initAll } from '/assets/govuk/govuk-frontend.min.js'

initAll()
window.MOJFrontend.initAll()

/**
 * Sends an event to Google Analytics if the site tag is installed
 * @param {string} eventName
 * @param {Record<string, string | null>} [eventParameters]
 */
function sendGoogleAnalyticsEvent(eventName, eventParameters) {
  if (typeof gtag === 'function') {
    if (eventParameters) {
      gtag('event', eventName, eventParameters)
    } else {
      gtag('event', eventName)
    }
  }
}

function gaEventHandler() {
  const elem = $(this)

  const gaCategory = elem.data('ga-category') || null
  const gaAction = elem.data('ga-action') || null
  const gaLabel = elem.data('ga-label') || null

  sendGoogleAnalyticsEvent('non_associations_event', {
    category: gaCategory,
    action: gaAction,
    label: gaLabel,
  })
}

$(function pageLoaded() {
  // for clickable cards, forward a click anywhere inside it to single contained link, if it exists
  $('.dps-card--clickable').each((index, card) => {
    const $links = $('.dps-card__link', card)
    if ($links.length === 1) {
      const $card = $(card)
      $card.on('click', e => {
        if (e.target.nodeName !== 'A') {
          e.stopPropagation()
          $links[0].click()
        }
      })
    }
  })

  // add GA click handler
  $('a[data-ga-category]').on('click', gaEventHandler)
})
