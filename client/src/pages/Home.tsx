import { Layout } from '../components/layout/Layout'
import { Hero } from '../components/home/Hero'
import { FeaturedCollections } from '../components/home/FeaturedCollections'
import { BestSellers } from '../components/home/BestSellers'
import { HowItWorks } from '../components/home/HowItWorks'

export function Home() {
  return (
    <Layout>
      <Hero />
      <FeaturedCollections />
      <BestSellers />
      <HowItWorks />
    </Layout>
  )
}
