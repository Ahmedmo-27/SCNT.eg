import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { StarLoader } from './components/ui/StarLoader'
import { Seo } from './components/seo/Seo'
import { buildOrganizationSchema, buildWebsiteSchema } from './seo/schema'

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

  if (pathname.startsWith('/product/') || pathname.startsWith('/collections/')) return null

  const defaults: Record<string, { title: string; description: string; noindex?: boolean }> = {
    '/': {
      title: 'Luxury Fragrances in Egypt',
      description: 'Shop premium fragrances in Egypt from SCNT.eg. Discover signature scent collections, notes, and identity-led perfume stories.',
    },
    '/shop': {
      title: 'Shop Perfumes Online Egypt',
      description: 'Explore SCNT.eg perfumes by collection, notes, and style. Find long-lasting fragrances crafted for modern Egyptian lifestyles.',
    },
    '/collections': {
      title: 'Fragrance Collections',
      description: 'Discover the SCNT.eg fragrance collections and explore scent families designed around mood, identity, and everyday rituals.',
    },
    '/find-your-scnt': {
      title: 'Find Your Signature Scent',
      description: 'Use the SCNT.eg scent finder to match your personality with notes, styles, and occasions for your next signature perfume.',
    },
    '/about': {
      title: 'About SCNT.eg',
      description: 'Learn the story behind SCNT.eg and our fragrance philosophy, craftsmanship, and identity-first approach to perfume in Egypt.',
    },
    '/contact': {
      title: 'Contact SCNT.eg',
      description: 'Get in touch with SCNT.eg for fragrance support, order help, and product recommendations tailored to your scent preferences.',
    },
    '/faqs': {
      title: 'Fragrance FAQs',
      description: 'Read common SCNT.eg perfume FAQs about scent longevity, notes, shipping, and choosing fragrances for your identity and routine.',
    },
    '/cart': {
      title: 'Your Cart',
      description: 'Review your selected SCNT.eg fragrances before checkout.',
      noindex: true,
    },
    '/checkout': {
      title: 'Checkout',
      description: 'Secure checkout for your SCNT.eg fragrance order.',
      noindex: true,
    },
    '/wishlist': {
      title: 'Your Wishlist',
      description: 'Save your favorite SCNT.eg fragrances for later.',
      noindex: true,
    },
    '/login': {
      title: 'Login',
      description: 'Sign in to your SCNT.eg account.',
      noindex: true,
    },
    '/register': {
      title: 'Create Account',
      description: 'Create your SCNT.eg account to manage orders and wishlist.',
      noindex: true,
    },
    '/verify-email': {
      title: 'Verify Email',
      description: 'Verify your email to secure your SCNT.eg account.',
      noindex: true,
    },
    '/profile': {
      title: 'My Profile',
      description: 'Manage your SCNT.eg account profile and preferences.',
      noindex: true,
    },
    '/admin': {
      title: 'Admin',
      description: 'SCNT.eg administration panel.',
      noindex: true,
    },
  }

  const page = defaults[pathname] ?? {
    title: 'SCNT.eg',
    description: 'Explore SCNT.eg fragrances in Egypt.',
    noindex: pathname !== '/',
  }

  return (
    <Seo
      title={page.title}
      description={page.description}
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
