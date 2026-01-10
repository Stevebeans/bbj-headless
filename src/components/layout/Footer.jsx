import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-500 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-osw text-lg font-semibold text-secondary-500 mb-4">
              Big Brother Junkies
            </h3>
            <p className="text-gray-300 text-sm">
              Your #1 source for Big Brother live feed updates, spoilers, and
              community discussion since 2010.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-osw text-lg font-semibold text-secondary-500 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/become-supporter" className="text-gray-300 hover:text-white">
                  Become a Supporter
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-osw text-lg font-semibold text-secondary-500 mb-4">
              Follow Us
            </h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/bigbrotherjunkies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/bigbrotherjunky/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-400 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Big Brother Junkies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
