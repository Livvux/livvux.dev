import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Nodejs } from "@/components/ui/svgs/nodejs";
import { Python } from "@/components/ui/svgs/python";
import { Postgresql } from "@/components/ui/svgs/postgresql";
import { Wordpress } from "@/components/ui/svgs/wordpress";

export const DATA = {
  name: "Lucas Kleipoedszus",
  initials: "LK",
  url: "https://livvux.dev",
  location: "Karlsruhe, Germany",
  locationLink: "https://www.google.com/maps/place/Karlsruhe",
  description:
    "Freelance software developer since 2015. I build web apps, WordPress products, browser extensions and AI integrations — and make music as Livvux.",
  summary:
    "Since 2015 I've been self-employed as a freelance developer. I design and ship products end to end: [StreamerLoft](https://streamerloft.com), a WordPress kit that gives Twitch creators a home for their stream, [pfotenweb.de](https://pfotenweb.de), a self-hosted website for animal welfare organizations, and a growing set of open-source tools on [GitHub](https://github.com/Livvux) — from WordPress AI plugins to FiveM tooling. Based in Karlsruhe, Germany. Away from the keyboard, I produce emotional EDM as [Livvux](https://livvux.com).",
  avatarUrl: "/me.png",
  skills: [
    { name: "TypeScript", icon: Typescript },
    { name: "React", icon: ReactLight },
    { name: "Next.js", icon: NextjsIconDark },
    { name: "Node.js", icon: Nodejs },
    { name: "PHP", icon: undefined },
    { name: "WordPress", icon: Wordpress },
    { name: "Python", icon: Python },
    { name: "PostgreSQL", icon: Postgresql },
    { name: "Astro", icon: undefined },
    { name: "Lua", icon: undefined },
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/Livvux",
        icon: Icons.github,
        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/lucaskleipoedszus/",
        icon: Icons.linkedin,
        navbar: true,
      },
      X: {
        name: "X",
        url: "https://x.com/Livvux",
        icon: Icons.x,
        navbar: true,
      },
      Youtube: {
        name: "Youtube",
        url: "https://www.youtube.com/livvux",
        icon: Icons.youtube,
        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "#",
        icon: Icons.email,
        navbar: false,
      },
    },
  },

  work: [],
  education: [],
  projects: [
    {
      title: "How Its Built",
      href: "https://howitsbuilt.fyi/",
      dates: "2026 - Present",
      active: true,
      description:
        "An open-source, privacy-conscious Chrome extension that identifies a website's frameworks, CMS, analytics and other technologies on demand. Free local scans, with optional deeper analysis on the web.",
      technologies: ["TypeScript", "WXT", "Chrome Extension", "Open Source"],
      links: [
        {
          type: "Website",
          href: "https://howitsbuilt.fyi/",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/Livvux/howitsbuilt-extension",
          icon: <Icons.github className="size-3" />,
        },
        {
          type: "Article",
          href: "/blog/how-its-built-browser-extension",
          icon: <NotebookIcon className="size-3" />,
        },
      ],
      image: "/images/blog/how-its-built/overview.svg",
      video: "",
    },
    {
      title: "StreamerLoft",
      href: "https://streamerloft.com",
      dates: "",
      active: true,
      description:
        "A WordPress kit for Twitch creators: creator profile, click-to-load player, schedule, clips and community pages. Ships as a free Core edition, a Pro tier with multi-channel collections and a complete Midnight theme kit.",
      technologies: ["WordPress", "PHP", "TypeScript"],
      links: [
        {
          type: "Website",
          href: "https://streamerloft.com",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "streamerloft.png",
      video: "",
    },
    {
      title: "pfotenweb.de",
      href: "https://pfotenweb.de",
      dates: "2026 - Present",
      active: true,
      description:
        "MIT-licensed, self-hosted website for animal welfare organizations. Install it yourself, adapt it to your shelter and run it — no vendor lock-in.",
      technologies: ["TypeScript", "Docker", "Next.js"],
      links: [
        {
          type: "Website",
          href: "https://pfotenweb.de",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/Livvux/pfotenweb",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "pfotenweb.png",
      video: "",
    },
    {
      title: "Open Source",
      href: "https://github.com/Livvux",
      dates: "",
      active: true,
      description:
        "My public GitHub work: WordPress plugins for AI translation engines, an MCP client for WordPress, a Chrome extension for local full-text search and backups, FiveM tooling and more.",
      technologies: ["TypeScript", "PHP", "Python", "Lua"],
      links: [
        {
          type: "GitHub",
          href: "https://github.com/Livvux",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "opensource.png",
      video: "",
    },
  ],
  hackathons: [],
} as const;
