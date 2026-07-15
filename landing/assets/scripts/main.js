const screenshotIntervalMs = 3000
const latestApkUrl =
    'https://github.com/PedroVidalDev/fitcha/releases/latest/download/fitcha.apk'

function startScreenshotCarousel() {
    const screenshots = Array.from(document.querySelectorAll('.app-screenshot'))
    if (screenshots.length <= 1) return

    let activeIndex = screenshots.findIndex((image) =>
        image.classList.contains('is-active'),
    )

    if (activeIndex < 0) {
        activeIndex = 0
        screenshots[activeIndex].classList.add('is-active')
    }

    window.setInterval(() => {
        screenshots[activeIndex].classList.remove('is-active')
        activeIndex = (activeIndex + 1) % screenshots.length
        screenshots[activeIndex].classList.add('is-active')
    }, screenshotIntervalMs)
}

function hydrateDownloadLinks() {
    const downloadLinks = Array.from(document.querySelectorAll('.js-download-link'))
    if (downloadLinks.length === 0) return

    downloadLinks.forEach((link) => {
        link.href = latestApkUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
    })
}

document.addEventListener('DOMContentLoaded', () => {
    startScreenshotCarousel()
    hydrateDownloadLinks()
})
