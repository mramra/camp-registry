// ══ Service Worker — سجل أسر المخيم ══
// غيّر هذا الرقم عند كل تحديث للتطبيق
const CACHE_VERSION = 'camp-registry-v1'

const CACHE_FILES = [
  'index.html',
  'manifest.json',
]

// ── تثبيت: خزّن الملفات ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_FILES).catch(() => {
        // لو فشل بعضها، تجاهل
      })
    })
  )
})

// ── تفعيل: احذف الكاش القديم ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// ── الطلبات: Network First مع Fallback للكاش ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Supabase و CDN — لا تتدخل، اتركها للشبكة
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.jsdelivr.net')
  ) {
    return
  }

  // باقي الطلبات: جرب الشبكة أولاً، لو فشلت استخدم الكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // خزّن نسخة جديدة في الكاش
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // الشبكة فشلت — ارجع للكاش
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // لو ما في كاش وطلب HTML — ارجع index.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('index.html')
          }
        })
      })
  )
})

// ── استقبال رسالة SKIP_WAITING للتحديث الفوري ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
