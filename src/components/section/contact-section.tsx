import Link from "next/link";
import { DATA } from "@/data/resume";

export default function ContactSection() {
  return (
    <div className="border rounded-xl p-10 relative">
      <div className="absolute -top-4 border bg-primary z-10 rounded-xl px-4 py-1 left-1/2 -translate-x-1/2">
        <span className="text-background text-sm font-medium">Contact</span>
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
          Get in Touch
        </h2>
        <p className="mx-auto max-w-lg text-muted-foreground text-balance">
          Building a product or need help with a web application? Tell me what
          you are working on and what you need.
        </p>
        <Link
          href="mailto:lucas@lkmedia.net?subject=Project%20inquiry"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Email me about your project
        </Link>
        <p className="text-sm text-muted-foreground">
          See <Link href="https://lkmedia.net/cases" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">client case studies</Link> or <Link href={DATA.contact.social.X.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">message me on X</Link>.
        </p>
      </div>
    </div>
  );
}

