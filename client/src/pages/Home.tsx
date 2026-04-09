import { Layout } from '../components/layout/Layout'
import { Hero } from '../components/home/Hero'
import { FeaturedCollections } from '../components/home/FeaturedCollections'
import { FindYourScent } from '../components/home/FindYourScent'
import { BestSellers } from '../components/home/BestSellers'

export function Home() {
  return (
    <Layout>
      <Hero />
      <FeaturedCollections />
      <FindYourScent />
      <BestSellers />
    </Layout>
  )
}
