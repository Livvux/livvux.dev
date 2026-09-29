"""Validate the built site's sitemap using only the Python standard library.

Run from the repository root with SITEMAP_BASE_URL=http://127.0.0.1:3000.
"""

import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, build_opener
from xml.etree import ElementTree

ORIGIN = "https://livvux.dev"
BASE_URL = os.environ["SITEMAP_BASE_URL"].rstrip("/")
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
STATIC_PATHS = {"/", "/blog", "/tools", "/tools/internal-links", "/tools/crawler"}


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch(path):
    # A sitemap must point directly to 200 responses, not redirect destinations.
    with build_opener(NoRedirects).open(BASE_URL + path, timeout=30) as response:
        assert response.status == 200, (path, response.status)
        return response.headers, response.read()


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.robots = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.append(attrs.get("href", ""))
        if tag == "meta" and attrs.get("name", "").lower() in {"robots", "googlebot"}:
            self.robots.append(attrs.get("content", ""))


headers, xml = fetch("/sitemap.xml")
assert headers.get_content_type() in {"application/xml", "text/xml"}, headers
# XML permits an omitted HTTP charset (RFC 7303); Next.js uses application/xml.
# Reject a conflicting declared charset and strictly decode the actual bytes below.
assert headers.get_content_charset() in {None, "utf-8"}, headers
assert len(xml) <= 50 * 1024 * 1024, "Split the sitemap before exceeding 50 MB"
root = ElementTree.fromstring(xml.decode("utf-8"))
assert root.tag == f"{{{NS['s']}}}urlset", root.tag
nodes = root.findall("s:url", NS)
assert 0 < len(nodes) <= 50_000, "Split the sitemap before exceeding 50,000 URLs"
locations = [node.findtext("s:loc", namespaces=NS) for node in nodes]
assert all(locations), "Every entry needs a loc"
assert len(locations) == len(set(locations)), "Duplicate sitemap URLs"

# Discover real content files independently of the sitemap implementation.
expected = {ORIGIN + path for path in STATIC_PATHS}
translations = {}
for file in Path("content").glob("*/*.mdx"):
    if file.stem not in {"en", "de"}:
        continue
    slug = quote(file.parent.name, safe="")
    path = f"/blog/{slug}" + ("/de" if file.stem == "de" else "")
    url = ORIGIN + path
    expected.add(url)
    translations.setdefault(slug, {})[file.stem] = url
assert set(locations) == expected, {
    "missing": sorted(expected - set(locations)),
    "unexpected": sorted(set(locations) - expected),
}

for node in nodes:
    loc = node.findtext("s:loc", namespaces=NS)
    url = urlsplit(loc)
    assert (url.scheme, url.netloc) == ("https", "livvux.dev"), loc
    assert not url.query and not url.fragment, loc
    assert node.find("s:priority", NS) is None, loc
    assert node.find("s:changefreq", NS) is None, loc
    lastmod = node.findtext("s:lastmod", namespaces=NS)
    if lastmod:
        datetime.fromisoformat(lastmod.replace("Z", "+00:00"))
    if url.path in STATIC_PATHS:
        assert lastmod is None, f"Invented static-page lastmod: {loc}"
    links = node.findall("x:link", NS)
    languages = {link.attrib["hreflang"]: link.attrib["href"] for link in links}
    assert len(languages) == len(links), f"Duplicate hreflang: {loc}"
    for link in links:
        assert link.attrib.get("rel") == "alternate", loc
        assert link.attrib["href"] in expected, loc
    if url.path.startswith("/blog/"):
        group = translations[url.path.split("/")[2]]
        assert languages == (group if len(group) > 1 else {}), loc
    else:
        assert not languages, loc


def check_page(loc):
    path = urlsplit(loc).path
    headers, body = fetch(path)
    assert headers.get_content_type() == "text/html", loc
    assert "noindex" not in headers.get("X-Robots-Tag", "").lower(), loc
    parser = MetadataParser()
    parser.feed(body.decode("utf-8"))
    assert all("noindex" not in rule.lower() for rule in parser.robots), loc
    # Existing static pages without an explicit canonical are still indexable.
    # Wherever a canonical is declared, the sitemap must agree with it.
    if parser.canonicals:
        assert len(parser.canonicals) == 1, (loc, parser.canonicals)
        canonical = urljoin(loc, parser.canonicals[0])
        assert canonical.rstrip("/") == loc.rstrip("/"), (loc, canonical)


with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(check_page, locations))

headers, body = fetch("/robots.txt")
assert headers.get_content_type() == "text/plain", headers
robots = body.decode("utf-8")
assert f"Sitemap: {ORIGIN}/sitemap.xml" in robots, robots
assert "User-Agent: *" in robots or "User-agent: *" in robots, robots
assert "Allow: /" in robots and "Disallow: /api/" in robots, robots
assert "Disallow: /_next" not in robots, "Do not block rendering assets"
print(f"Verified {len(locations)} sitemap URLs: XML, coverage, hreflang, HTTP 200, canonicals and robots.txt.")
