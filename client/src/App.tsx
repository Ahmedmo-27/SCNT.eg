import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { CartPage } from './pages/CartPage'
import { CollectionDetailPage } from './pages/CollectionDetailPage'
import { CollectionsPage } from './pages/CollectionsPage'
import { AboutPage } from './pages/AboutPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ContactPage } from './pages/ContactPage'
import { Home } from './pages/Home'
import { LoginPage } from './pages/LoginPage'
import { ProductPage } from './pages/ProductPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { ShopAllPage } from './pages/ShopAllPage'
import { FindYourScntPage } from './pages/FindYourScntPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopAllPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/find-your-scnt" element={<FindYourScntPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}
