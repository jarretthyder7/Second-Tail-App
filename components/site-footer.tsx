import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/20 bg-[#D76B1A] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <Link href="/" className="text-xl sm:text-2xl font-bold text-white inline-block mb-4">
              Second Tail
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 md:justify-end md:items-start">
            <Link href="/for-rescue-organizations" className="text-white/90 hover:text-white transition-colors text-sm">
              For Rescues
            </Link>
            <Link href="/for-fosters" className="text-white/90 hover:text-white transition-colors text-sm">
              For Fosters
            </Link>
            <Link href="/login/rescue" className="text-white/90 hover:text-white transition-colors text-sm">
              Login
            </Link>
            <Link href="/sign-up/foster" className="text-white/90 hover:text-white transition-colors text-sm">
              Sign Up to Foster
            </Link>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <a href="mailto:hello@getsecondtail.com" className="text-white/90 hover:text-white transition-colors text-sm">
              hello@getsecondtail.com
            </a>
            <p className="text-xs sm:text-sm text-white/80">
              © 2026 Second Tail. Made with care for rescues and fosters.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
