window.GOVUKFrontend.initAll()
window.MOJFrontend.initAll()

/**
 * Sends an event to Google Analytics if the site tag is installed
 * @param {string} eventName
 * @param {Record<string, string>} [eventParameters]
 */
// eslint-disable-next-line no-unused-vars
function sendGoogleAnalyticsEvent(eventName, eventParameters) {
  if (typeof gtag === 'function') {
    if (eventParameters) {
      gtag('event', eventName, eventParameters)
    } else {
      gtag('event', eventName)
    }
  }
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
})
