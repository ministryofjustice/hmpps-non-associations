import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'

govukFrontend.initAll()
mojFrontend.initAll()

/**
 * Sends an event to Google Analytics if the site tag is installed
 * @param {string} eventName
 * @param {Record<string, string | null>} [eventParameters]
 */
function sendGoogleAnalyticsEvent(eventName: string, eventParameters: Record<string, string>) {
  if (typeof gtag === 'function') {
    if (eventParameters) {
      gtag('event', eventName, eventParameters)
    } else {
      gtag('event', eventName)
    }
  }
}

function gaEventHandler(this: HTMLElement) {
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
  // add GA click handler
  $('a[data-ga-category]').on('click', gaEventHandler)

  // add GA toggle handler to help-with-roles component
  $<HTMLDetailsElement>('details.app-help-with-roles').on('toggle', event => {
    sendGoogleAnalyticsEvent('non_associations_event', {
      category: event.target.open ? 'Help with roles > Opened box' : 'Help with roles > Closed box',
    })
  })
})
