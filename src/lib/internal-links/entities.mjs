// Decode WHATWG HTML character references without executing or rendering the page.
import data1 from './entity-data-1.mjs';
import data2 from './entity-data-2.mjs';
import data3 from './entity-data-3.mjs';
import data4 from './entity-data-4.mjs';
const named = Object.fromEntries([data1, data2, data3, data4].join(' ').split(' ').map((pair) => { const [name, points] = pair.split('='); return [name, String.fromCodePoint(...points.split('-').map((point) => parseInt(point, 16)))]; }));
const legacy = new Set(`AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml`.split(' '));
const c1 = {128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};
// Named references are at most 32 characters; bound scans on hostile HTML.
export function decodeEntities(text, attribute = false) {
  return text.replace(/&(#x[\da-f]+;?|#\d+;?|[a-z][\da-z]{0,31};?)/gi, (full, entity, offset) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      let point = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      point = c1[point] ?? point;
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '\ufffd';
    }
    if (entity.endsWith(';') && Object.hasOwn(named, entity.slice(0, -1))) return named[entity.slice(0, -1)];
    for (let end = entity.length; end > 0; end--) {
      const name = entity.slice(0, end);
      if (legacy.has(name) && Object.hasOwn(named, name)) {
        if (attribute && /[=a-z\d]/i.test(entity[end] ?? text[offset + full.length] ?? '')) return full;
        return named[name] + entity.slice(end);
      }
    }
    return full;
  });
}
