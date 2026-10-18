"""Inspect production HTML without executing JavaScript. No third-party packages.

Run after `pnpm build` / `pnpm start`:
    SEO_BASE_URL=http://127.0.0.1:3000 python3 tests/seo.integration.py
Canonical URLs intentionally remain on the production origin.
"""
import json
import os
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from xml.etree import ElementTree

BASE = os.environ.get("SEO_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
ORIGIN = "https://livvux.dev"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = build_opener(NoRedirect())


def fetch(path):
    request = Request(BASE + path, headers={"User-Agent": "Googlebot"})
    try:
        response = opener.open(request, timeout=60)
    except HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.canonicals = []
        self.alternates = {}
        self.links = []
        self.schemas = []
        self.h1 = []
        self.main_languages = []
        self._heading = False
        self._json = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = attrs.get("name") or attrs.get("property")
            if key:
                self.meta[key] = attrs.get("content", "")
        if tag == "link":
            rel = attrs.get("rel", "").split()
            if "canonical" in rel:
                self.canonicals.append(attrs.get("href"))
            if "alternate" in rel and "hreflang" in attrs:
                self.alternates[attrs["hreflang"]] = attrs.get("href")
        if tag == "a":
            self.links.append(attrs.get("href", ""))
        if tag == "main":
            self.main_languages.append(attrs.get("lang"))
        if tag == "h1":
            self._heading = True
            self.h1.append("")
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self._json = ""

    def handle_data(self, data):
        if self._heading:
            self.h1[-1] += data
        if self._json is not None:
            self._json += data

    def handle_endtag(self, tag):
        if tag == "h1":
            self._heading = False
        if tag == "script" and self._json is not None:
            parsed = json.loads(self._json)
            self.schemas.extend(parsed.get("@graph", [parsed]))
            self._json = None


def normalized_url(url):
    # Next serializes the origin without a trailing slash. An empty root path
    # and "/" identify the same URL; preserve all non-root paths and queries.
    parsed = urlsplit(url)
    return parsed._replace(path=parsed.path or "/").geturl()


def page_at(path, canonical):
    status, headers, body = fetch(path)
    assert status == 200, (path, status)
    assert "text/html" in headers.get("Content-Type", ""), path
    page = Page(body.decode("utf-8"))
    assert len(page.canonicals) == 1, (path, page.canonicals)
    assert normalized_url(page.canonicals[0]) == normalized_url(canonical), (path, page.canonicals)
    assert page.meta.get("description", "").strip(), path
    assert normalized_url(page.meta.get("og:url", "")) == normalized_url(canonical), (path, page.meta.get("og:url"))
    assert page.meta.get("og:title") == page.meta.get("twitter:title"), path
    assert page.meta.get("og:description") == page.meta.get("description"), path
    for key in ("og:image", "twitter:image"):
        assert page.meta.get(key, "").startswith(("https://", "http://")), (path, key)
    assert page.meta.get("twitter:card") == "summary_large_image", path
    assert "noindex" not in page.meta.get("robots", ""), path
    assert "noindex" not in headers.get("X-Robots-Tag", ""), path
    assert page.h1 and page.h1[0].strip(), (path, "missing server-rendered H1")
    assert any(schema.get("@type") == "WebSite" for schema in page.schemas), path
    if path != "/":
        assert any(schema.get("@type") == "BreadcrumbList" for schema in page.schemas), path
    return page


def main():
    status, _, body = fetch("/sitemap.xml")
    assert status == 200
    root = ElementTree.fromstring(body)
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    entries = root.findall("s:url", namespace)
    pages = {}
    for entry in entries:
        url = entry.findtext("s:loc", namespaces=namespace)
        assert url.startswith(ORIGIN + "/"), url
        path = urlsplit(url).path
        page = page_at(path, url)
        pages[url] = page
        if path.startswith("/blog/") and path != "/blog/de":
            article = next(schema for schema in page.schemas if schema.get("@type") == "BlogPosting")
            lang = "de" if path.endswith("/de") else "en"
            assert lang in page.main_languages, path
            assert article["inLanguage"] == lang, path
            assert article["url"] == url, path
            assert article["mainEntityOfPage"]["@id"] == url, path
            assert article["headline"] == page.h1[0].strip(), path
            assert article["image"][0] == page.meta["og:image"], path
            assert article.get("dateModified") == entry.findtext("s:lastmod", namespaces=namespace), path
            assert page.meta.get("og:locale") == ("de_DE" if lang == "de" else "en_US"), path
            if lang == "de":
                assert any(link.endswith("/de") for link in page.links if link.startswith("/blog/")), path
        else:
            assert len(page.h1) == 1, (path, page.h1)
        print(f"PASS {path}")

    for url, page in pages.items():
        for language, alternate in page.alternates.items():
            assert alternate in pages, (url, language, alternate)
            assert pages[alternate].alternates == page.alternates, (url, alternate, "nonreciprocal hreflang")

    german_archive = pages[ORIGIN + "/blog/de"]
    assert any(link.endswith("/de") for link in german_archive.links if link.startswith("/blog/"))
    archive = pages[ORIGIN + "/blog"]
    # Follow every rendered archive page, not just the first page of the sitemap.
    archive_paths = sorted({link for link in archive.links if link.startswith("/blog?page=")})
    for path in archive_paths:
        page_at(path, ORIGIN + path)
    page_at("/blog?utm_source=seo-test", ORIGIN + "/blog")
    for path in ["/blog?page=1", "/blog?page=01"]:
        status, headers, _ = fetch(path)
        assert status == 308 and headers.get("Location", "").endswith("/blog"), (path, status)
    if "/blog?page=2" in archive_paths:
        status, headers, _ = fetch("/blog?page=02")
        assert status == 308 and headers.get("Location", "").endswith("/blog?page=2")
    for path in ["/blog?page=invalid", "/blog?page=999999", "/blog?page=1&page=2", "/blog/seo-test-does-not-exist"]:
        status, _, body = fetch(path)
        page = Page(body.decode("utf-8"))
        # Next may send 200 for a notFound() discovered after streaming starts;
        # in that case it MUST emit noindex. Never accept an indexable soft 404.
        assert status == 404 or (status == 200 and "noindex" in page.meta.get("robots", "")), (path, status)
    _, headers, _ = fetch("/api/tools/internal-links")
    assert "noindex" in headers.get("X-Robots-Tag", "")
    print(f"SEO HTML checks passed: {len(pages)} sitemap pages, {len(archive_paths)} additional archive pages, redirects and invalid URLs.")


if __name__ == "__main__":
    main()
