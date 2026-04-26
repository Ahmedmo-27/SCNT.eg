import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { StarLoader } from './components/ui/StarLoader'
import { Seo } from './components/seo/Seo'
import { buildOrganizationSchema, buildWebsiteSchema } from './seo/schema'
import { useI18n } from './i18n/I18nContext'

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const ShopAllPage = lazy(() => import('./pages/ShopAllPage').then((m) => ({ default: m.ShopAllPage })))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })))
const CollectionDetailPage = lazy(
  () => import('./pages/CollectionDetailPage').then((m) => ({ default: m.CollectionDetailPage })),
)
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })))
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })))
const FindYourScntPage = lazy(
  () => import('./pages/FindYourScntPage').then((m) => ({ default: m.FindYourScntPage })),
)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const VerifyEmailPage = lazy(
  () => import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function RouteSeo() {
  const { pathname } = useLocation()
  const { locale } = useI18n()

  if (pathname.startsWith('/product/') || pathname.startsWith('/collections/')) return null

  const defaults: Record<string, { title: { en: string; ar: string }; description: { en: string; ar: string }; noindex?: boolean }> = {
    '/': {
      title: { en: 'SCNT.eg Fragrances', ar: 'عطور SCNT.eg' },
      description: {
        en: 'Shop premium fragrances in Egypt from SCNT.eg. Discover signature scent collections, notes, and identity-led perfume stories.',
        ar: 'تسوق عطور SCNT.eg في مصر. اكتشف مجموعات عطرية مميزة ونفحات مصممة لهوية شخصية واضحة.',
      },
    },
    '/shop': {
      title: { en: 'Shop Perfumes Online Egypt', ar: 'تسوق العطور أونلاين في مصر' },
      description: {
        en: 'Explore SCNT.eg perfumes by collection, notes, and style. Find long-lasting fragrances crafted for modern Egyptian lifestyles.',
        ar: 'استكشف عطور SCNT.eg حسب المجموعة والمكونات والأسلوب. اعثر على عطور ثابتة تناسب أسلوب الحياة العصري في مصر.',
      },
    },
    '/collections': {
      title: { en: 'Fragrance Collections', ar: 'مجموعات العطور' },
      description: {
        en: 'Discover the SCNT.eg fragrance collections and explore scent families designed around mood, identity, and everyday rituals.',
        ar: 'تعرف على مجموعات SCNT.eg واستكشف عائلات عطرية مصممة حول المزاج والهوية والروتين اليومي.',
      },
    },
    '/find-your-scnt': {
      title: { en: 'Find Your Signature Scent', ar: 'اعثر على عطرك المميز' },
      description: {
        en: 'Use the SCNT.eg scent finder to match your personality with notes, styles, and occasions for your next signature perfume.',
        ar: 'استخدم أداة SCNT.eg لاختيار العطر الأنسب لشخصيتك حسب النوتات والأسلوب والمناسبة.',
      },
    },
    '/about': {
      title: { en: 'About SCNT.eg', ar: 'عن SCNT.eg' },
      description: {
        en: 'Learn the story behind SCNT.eg and our fragrance philosophy, craftsmanship, and identity-first approach to perfume in Egypt.',
        ar: 'تعرف على قصة SCNT.eg وفلسفتنا في صناعة العطور ونهجنا المبني على الهوية في مصر.',
      },
    },
    '/contact': {
      title: { en: 'Contact SCNT.eg', ar: 'تواصل مع SCNT.eg' },
      description: {
        en: 'Get in touch with SCNT.eg for fragrance support, order help, and product recommendations tailored to your scent preferences.',
        ar: 'تواصل مع SCNT.eg للمساعدة في الطلبات وتوصيات عطرية مناسبة لذوقك.',
      },
    },
    '/faqs': {
      title: { en: 'Fragrance FAQs', ar: 'أسئلة شائعة عن العطور' },
      description: {
        en: 'Read common SCNT.eg perfume FAQs about scent longevity, notes, shipping, and choosing fragrances for your identity and routine.',
        ar: 'اقرأ أكثر الأسئلة شيوعاً عن ثبات العطر والمكونات والشحن وكيفية اختيار العطر المناسب لك.',
      },
    },
    '/cart': {
      title: { en: 'Your Cart', ar: 'سلتك' },
      description: { en: 'Review your selected SCNT.eg fragrances before checkout.', ar: 'راجع اختياراتك قبل إتمام الطلب.' },
      noindex: true,
    },
    '/checkout': {
      title: { en: 'Checkout', ar: 'الدفع' },
      description: { en: 'Secure checkout for your SCNT.eg fragrance order.', ar: 'إتمام آمن لطلبك من SCNT.eg.' },
      noindex: true,
    },
    '/wishlist': {
      title: { en: 'Your Wishlist', ar: 'المفضلة' },
      description: { en: 'Save your favorite SCNT.eg fragrances for later.', ar: 'احفظ عطورك المفضلة للعودة إليها لاحقاً.' },
      noindex: true,
    },
    '/login': {
      title: { en: 'Login', ar: 'تسجيل الدخول' },
      description: { en: 'Sign in to your SCNT.eg account.', ar: 'سجّل الدخول إلى حسابك في SCNT.eg.' },
      noindex: true,
    },
    '/register': {
      title: { en: 'Create Account', ar: 'إنشاء حساب' },
      description: { en: 'Create your SCNT.eg account to manage orders and wishlist.', ar: 'أنشئ حسابك لإدارة الطلبات والمفضلة.' },
      noindex: true,
    },
    '/verify-email': {
      title: { en: 'Verify Email', ar: 'تأكيد البريد الإلكتروني' },
      description: { en: 'Verify your email to secure your SCNT.eg account.', ar: 'أكّد بريدك لحماية حسابك.' },
      noindex: true,
    },
    '/profile': {
      title: { en: 'My Profile', ar: 'حسابي' },
      description: { en: 'Manage your SCNT.eg account profile and preferences.', ar: 'أدر بيانات حسابك وتفضيلاتك.' },
      noindex: true,
    },
    '/admin': {
      title: { en: 'Admin', ar: 'لوحة الإدارة' },
      description: { en: 'SCNT.eg administration panel.', ar: 'لوحة إدارة SCNT.eg.' },
      noindex: true,
    },
  }

  const page = defaults[pathname] ?? {
    title: { en: 'SCNT.eg', ar: 'SCNT.eg' },
    description: { en: 'Explore SCNT.eg fragrances in Egypt.', ar: 'اكتشف عطور SCNT.eg في مصر.' },
    noindex: pathname !== '/',
  }

  return (
    <Seo
      title={page.title[locale]}
      description={page.description[locale]}
      path={pathname}
      noindex={Boolean(page.noindex)}
      jsonLd={[buildOrganizationSchema(), buildWebsiteSchema()]}
    />
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function RouteScrollLock() {
  const { pathname } = useLocation()
  const lockScroll = pathname === '/collections' || pathname.startsWith('/collections/')

  useLayoutEffect(() => {
    if (!lockScroll) return

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousHtmlOverscroll = documentElement.style.overscrollBehavior

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    documentElement.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = previousBodyOverflow
      documentElement.style.overflow = previousHtmlOverflow
      body.style.overscrollBehavior = previousBodyOverscroll
      documentElement.style.overscrollBehavior = previousHtmlOverscroll
    }
  }, [lockScroll])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteScrollLock />
      <RouteSeo />
      <Suspense fallback={<StarLoader className="py-24" label="Loading page" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopAllPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faqs" element={<FaqPage />} />
          <Route path="/find-your-scnt" element={<FindYourScntPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
