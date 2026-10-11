import { ContentLink } from "@/components/content-link";
import BlurFade from "@/components/magicui/blur-fade";
import { DATA } from "@/data/resume";
import Markdown from "react-markdown";
import ContactSection from "@/components/section/contact-section";
import ProjectsSection from "@/components/section/projects-section";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPosts, hrefFor } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { UmamiPageview } from "@/components/umami-pageview";

const BLUR_FADE_DELAY = 0.04;
const homeTitle = `${DATA.name} | Freelance Software Developer`;

export const metadata: Metadata = {
  ...pageMetadata({
    title: homeTitle,
    description: "Freelance software developer in Karlsruhe since 2015. Web apps, WordPress products, AI integrations and open-source tools by Lucas Kleipoedszus (Livvux).",
    path: "/",
  }),
  title: { absolute: homeTitle },
};

export default function Page() {
  const latestPosts = getPosts().slice(0, 3);
  return (
    <main className="min-h-dvh flex flex-col gap-14 relative">
      <UmamiPageview path="/" title={homeTitle} />
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="gap-2 flex flex-col order-2 md:order-1">
              <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl">Hi, I&apos;m {DATA.name.split(" ")[0]}</h1>
              <p className="text-muted-foreground max-w-[600px] md:text-lg lg:text-xl">{DATA.description}</p>
            </div>
            <Image src={DATA.avatarUrl} alt={DATA.name} width={128} height={128} sizes="(min-width: 768px) 128px, 96px" preload className="order-1 md:order-2 size-24 md:size-32 shrink-0 object-cover border rounded-full shadow-lg ring-4 ring-muted" />
          </div>
        </div>
      </section>
      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}><h2 className="text-xl font-bold">About</h2></BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown components={{ a: ContentLink }}>{DATA.summary}</Markdown>
            </div>
          </BlurFade>
        </div>
      </section>
      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 9}><h2 className="text-xl font-bold">Skills</h2></BlurFade>
          <div className="flex flex-wrap gap-2">
            {DATA.skills.map((skill, id) => (
              <BlurFade key={skill.name} delay={BLUR_FADE_DELAY * 10 + id * 0.05}>
                <div className="border bg-background border-border ring-2 ring-border/20 rounded-xl h-8 w-fit px-4 flex items-center gap-2">
                  {skill.icon && <skill.icon className="size-4 rounded overflow-hidden object-contain" />}
                  <span className="text-foreground text-sm font-medium">{skill.name}</span>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
      <section id="projects"><BlurFade delay={BLUR_FADE_DELAY * 11}><ProjectsSection /></BlurFade></section>
      <section id="latest-articles" aria-labelledby="latest-articles-title" className="space-y-4">
        <h2 id="latest-articles-title" className="text-xl font-bold">Latest articles</h2>
        <ul className="space-y-4">
          {latestPosts.map((post) => (
            <li key={hrefFor(post)}>
              <Link href={hrefFor(post)} className="font-medium underline underline-offset-4">{post.title}</Link>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm"><Link href="/blog" className="underline underline-offset-4">Browse all articles</Link></p>
        <p className="text-sm text-muted-foreground">Working on your own website? Explore my <Link href="/tools" className="underline underline-offset-4">website tools</Link>, including the <Link href="/tools/internal-links" className="underline underline-offset-4">internal link checker</Link>.</p>
      </section>
      <section id="contact"><BlurFade delay={BLUR_FADE_DELAY * 16}><ContactSection /></BlurFade></section>
    </main>
  );
}
