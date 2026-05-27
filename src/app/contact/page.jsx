import { getContactReasons, getRecaptchaSiteKey } from "@/lib/api/contact";
import { ContactForm } from "@/components/contact/ContactForm";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Big Brother Junkies. Questions, feedback, bug reports, or business inquiries - we'd love to hear from you!",
  openGraph: {
    title: "Contact Us - Big Brother Junkies",
    description:
      "Get in touch with Big Brother Junkies. Questions, feedback, bug reports, or business inquiries - we'd love to hear from you!",
    url: `${SITE_URL}/contact`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default async function ContactPage() {
  const [reasons, recaptchaSiteKey] = await Promise.all([
    getContactReasons(),
    getRecaptchaSiteKey(),
  ]);

  return (
    <main className="v2-primary-container">
      <div className="v2-primary-container-inner p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-primary-500 dark:text-primary-400 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hi? We&apos;d love to
            hear from you! Fill out the form below and we&apos;ll get back to
            you as soon as possible.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-xl mx-auto">
          <ContactForm reasons={reasons} recaptchaSiteKey={recaptchaSiteKey} />
        </div>

      </div>
    </main>
  );
}
