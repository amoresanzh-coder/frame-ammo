// Loads active portfolio items from Firestore into "Selected work".
const LAYOUTS = ['wide', 'tall', 'sq', 'full']

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))

const safe = (u) =>
  /^https?:\/\/|^\/\//.test(u || '') ? u : ''

export async function loadPortfolio() {
  const grid = document.querySelector('.work .grid')

  if (!grid || !import.meta.env.VITE_FIREBASE_PROJECT_ID) return

  try {
    const [{ db }, { collection, query, where, getDocs }] =
      await Promise.all([
        import('./firebase.js'),
        import('firebase/firestore'),
      ])

    const snap = await getDocs(
      query(
        collection(db, 'portfolio'),
        where('active', '==', true)
      )
    )

    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    if (!items.length) return

    grid.innerHTML = items.map((p, i) => {
      const tag = p.link && safe(p.link) ? 'a' : 'div'

      const href =
        tag === 'a'
          ? ` href="${esc(p.link)}" target="_blank" rel="noopener"`
          : ''

      const url = safe(p.image)

      // Определяем, что загружено: видео или изображение
      const isVideo =
        p.mediaType === 'video' ||
        /\/video\/upload\//.test(p.image || '') ||
        /\.(mp4|mov|webm|m4v)(\?|$)/i.test(p.image || '')

      let media = ''

      if (url && isVideo) {
        media = `
          <video
            src="${esc(url)}"
            muted
            loop
            autoplay
            playsinline
            preload="metadata"
          ></video>
        `
      } else if (url) {
        media = `
          <img
            src="${esc(url)}"
            alt="${esc(p.title)}"
            loading="lazy"
          />
        `
      } else {
        media = `<div class="ph ph--${(i % 5) + 1}"></div>`
      }

      return `
        <${tag}${href}
          class="card card--${LAYOUTS[i % 4]} is-in"
          data-cursor
        >
          <div class="media">
            ${media}
          </div>

          <div class="card__info">
            <span>${esc(p.category)}</span>
            <b>${esc(p.title)}</b>
            <span>${esc(p.year)} ↗</span>
          </div>
        </${tag}>
      `
    }).join('')

    const cursor = document.getElementById('cursor')

    if (cursor) {
      grid.querySelectorAll('[data-cursor]').forEach((el) => {
        el.addEventListener('mouseenter', () =>
          cursor.classList.add('is-on')
        )

        el.addEventListener('mouseleave', () =>
          cursor.classList.remove('is-on')
        )
      })
    }
  } catch (e) {
    console.warn('Portfolio fallback in use:', e)
  }
}