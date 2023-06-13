window.GOVUKFrontend.initAll()
window.MOJFrontend.initAll()

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
