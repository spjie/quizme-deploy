import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-primary uppercase tracking-wide">
            MADE BY SOPHIE MA
          </span>
          <Link
            href="/contact"
            className="text-sm text-primary uppercase tracking-wide hover:text-primary-dark"
          >
            CONTACT
          </Link>
        </div>
      </div>
    </footer>
  )
}
