import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartPage } from './pages/CartPage'
import { CollectionDetailPage } from './pages/CollectionDetailPage'
import { CollectionsPage } from './pages/CollectionsPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { Home } from './pages/Home'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProductPage } from './pages/ProductPage'
import { ShopAllPage } from './pages/ShopAllPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopAllPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <PlaceholderPage
              title="Checkout"
              subtitle="Order flow will call POST /api/checkout and POST /api/orders."
            />
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  )
}
