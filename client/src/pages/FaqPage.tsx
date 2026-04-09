import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Are your fragrances authentic?',
    answer:
      'Yes. We work directly with trusted suppliers and house standards: every product we sell is genuine. If you ever have a concern about a specific order, contact us with your order details and we will resolve it quickly.',
  },
  {
    question: 'How do I choose a fragrance online?',
    answer:
      'Start with our Find your SCNT flow for a guided match, or explore collections by mood and character. Notes listed on each product page describe how a scent opens and dries down — useful if you already know ingredients you love.',
  },
  {
    question: 'Do you ship across Egypt?',
    answer:
      'We ship domestically within Egypt. Delivery timelines and fees are confirmed at checkout and may vary by city. You will receive tracking or dispatch details with your order confirmation when available.',
  },
  {
    question: 'What is your returns or exchange policy?',
    answer:
      'Each full bottle ships with a complimentary decant so you can wear and test the scent first. Returns are only accepted when the full bottle is still sealed and unopened — once the main bottle is opened, it cannot be returned. Use the decant to decide before breaking the seal. Eligible unopened bottles may be returned within 14 days of your order (postmark deadline), with full refund of the purchase price and return shipping covered for accepted returns. Defective or incorrect shipments are handled separately — contact us with your order details.',
  },
  {
    question: 'Why is there a small decant in my box?',
    answer:
      'The decant is your risk-free way to try the fragrance on skin and room without opening the retail bottle. If you love it, open the full bottle. If not, you can request a return only while that full bottle stays sealed.',
  },
  {
    question: 'How should I store my bottle?',
    answer:
      'Keep fragrances away from direct sunlight and heat, and store bottles upright with the cap closed. A cool, stable environment helps preserve the juice and keeps projection consistent over time.',
  },
  {
    question: 'How can I contact SCNT?',
    answer:
      'Visit our contact page for Instagram and email — we reply as soon as we can for orders, sizing questions, and general inquiries.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-scnt-border/60 pb-1 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-left font-medium text-scnt-text [-webkit-details-marker]:hidden [&::-webkit-details-marker]:hidden">
        <span className="text-base leading-snug sm:text-[1.05rem]">{question}</span>
        <span className="mt-0.5 shrink-0 text-scnt-text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className="pb-5 pt-0 pr-8 text-sm leading-relaxed text-scnt-text-muted">{answer}</div>
    </details>
  )
}

export function FaqPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            Help
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">
            Quick answers about shopping, shipping, and caring for your SCNT. Still unsure? We are happy to help on{' '}
            <Link to="/contact" className="text-scnt-text underline-offset-4 hover:underline">
              Contact
            </Link>
            .
          </p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <Card asMotion={false} className="mx-auto max-w-3xl px-6 py-2 sm:px-10 sm:py-4">
          {faqs.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </Card>

        <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-scnt-text-muted">
          <Link
            to="/"
            className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
          >
            <EightPointStar size={10} className="opacity-40" />
            Back to home
          </Link>
        </p>
      </div>
    </Layout>
  )
}
