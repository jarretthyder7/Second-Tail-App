import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Second Tail",
  description: "Privacy Policy for Second Tail, the foster coordination platform for animal rescue organizations.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Second Tail
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Last updated: April 2026</p>
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Your privacy matters to us. Here is exactly what data we collect, how we use it, and how we protect it.
            </p>
          </div>

          <hr className="border-gray-200" />

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">What data we collect</h2>
            <p className="text-gray-700 leading-relaxed">
              When you use Second Tail, we collect the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
              <li>
                <strong>Account information</strong> — your name, email address, and phone number when you
                register.
              </li>
              <li>
                <strong>Animal care logs</strong> — notes, health records, and other care information you enter
                for the animals in your foster care.
              </li>
              <li>
                <strong>Messages</strong> — communications sent between fosters and rescue organizations within
                the platform.
              </li>
              <li>
                <strong>Usage data</strong> — basic information about how you interact with the platform, used
                to improve the product.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">How we use your data</h2>
            <p className="text-gray-700 leading-relaxed">
              We use your data solely to operate the Second Tail platform. Specifically, this means:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
              <li>Providing you with access to your account and dashboard.</li>
              <li>Connecting fosters with their rescue organizations.</li>
              <li>Storing and displaying animal care logs and records.</li>
              <li>Delivering messages between platform users.</li>
              <li>Improving the platform based on how it is used.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do not use your data for advertising or sell it to any third party — ever.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">How your data is stored</h2>
            <p className="text-gray-700 leading-relaxed">
              All data is stored securely using{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 font-medium underline hover:no-underline"
              >
                Supabase
              </a>
              , a trusted database infrastructure provider. Your data is stored in encrypted databases with
              row-level security enabled, meaning users can only access data they are authorized to see.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">We never sell your data</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail does not sell, rent, or share your personal data with third-party advertisers or data
              brokers. Your information exists only to make the platform work for you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail uses cookies only for authentication purposes — to keep you logged in securely between
              sessions. We do not use tracking cookies, advertising cookies, or any other third-party cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Your rights and data deletion</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to request a copy of your data or ask us to delete it at any time. To make a
              data deletion request, email us at{" "}
              <a href="mailto:support@secondtail.com" className="text-gray-900 font-medium underline hover:no-underline">
                support@secondtail.com
              </a>{" "}
              and we will process your request promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Contact us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this privacy policy or how your data is handled, contact us at{" "}
              <a href="mailto:support@secondtail.com" className="text-gray-900 font-medium underline hover:no-underline">
                support@secondtail.com
              </a>
              .
            </p>
          </section>

          <hr className="border-gray-200" />

          <Link href="/" className="inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
