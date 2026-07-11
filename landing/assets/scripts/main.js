const screenshotIntervalMs = 3000
const releaseEndpoint = 'https://fitchaapi.pedrovidaldev.com.br/app/release'

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

async function hydrateDownloadLinks() {
    const downloadLinks = Array.from(document.querySelectorAll('.js-download-link'))
    if (downloadLinks.length === 0) return

    try {
        const response = await fetch(releaseEndpoint, {
            headers: { Accept: 'application/json' },
        })

        if (!response.ok || response.status === 204) return

        const release = await response.json()
        if (!release?.releaseUrl) return

        downloadLinks.forEach((link) => {
            link.href = release.releaseUrl
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
        })
    } catch {
        downloadLinks.forEach((link) => {
            link.dataset.releaseUnavailable = 'true'
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    startScreenshotCarousel()
    hydrateDownloadLinks()
})
