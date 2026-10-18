import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { UMAMI_WEBSITE_ID, validUmamiWebsiteId } from "@/lib/umami";

export const metadata = {
  ...pageMetadata({
    title: "Datenschutzerklärung",
    description: "Informationen zur Verarbeitung technischer Zugriffsdaten, selbst gehosteter Statistiken, externer Medien und Kontaktanfragen auf livvux.dev.",
    path: "/privacy/de",
  }),
  alternates: { canonical: "https://livvux.dev/privacy/de", languages: { en: "https://livvux.dev/privacy", de: "https://livvux.dev/privacy/de" } },
};

export default function PrivacyGerman() {
  const analytics = validUmamiWebsiteId(UMAMI_WEBSITE_ID);
  return <main lang="de" className="prose max-w-full dark:prose-invert">
    <Breadcrumbs label="Brotkrumennavigation" items={[{ name: "Startseite", href: "/" }, { name: "Datenschutz", href: "/privacy/de" }]} />
    <h1>Datenschutzerklärung</h1>
    <p className="text-sm"><Link href="/privacy" hrefLang="en">Read in English</Link></p>
    <p>Stand: 18. Oktober 2026. Diese Erklärung gilt für <strong>livvux.dev</strong>, nicht für separat verlinkte Produkte und Websites.</p>
    <h2>1. Verantwortlicher</h2>
    <p>{LEGAL.business}, {LEGAL.name}, {LEGAL.address.join(", ")}. E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Vollständige Angaben: <Link href="/imprint">Impressum</Link>.</p>
    <h2>2. Hosting und Server-Logs</h2>
    <p>Beim Seitenaufruf müssen der Webserver sowie gegebenenfalls Hosting- und Proxy-Dienste technische Daten verarbeiten: IP-Adresse, Zeitpunkt, angeforderte Ressourcen und technische Browser- bzw. Netzwerkheader. Zwecke sind Verfügbarkeit, Fehleranalyse und Missbrauchsschutz. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen). Betriebsprotokolle werden nur so lange gespeichert, wie dies für diese Zwecke erforderlich ist; die konkreten Fristen ergeben sich aus der Hosting- und Proxy-Konfiguration und gesetzlichen Aufbewahrungspflichten. Die geltenden Fristen können über den angegebenen Kontakt erfragt werden.</p>
    <h2>3. Einstellungen im Browser</h2>
    <p>Die gewählte Hell-/Dunkel-Darstellung kann lokal im Browser gespeichert werden. Diese Einstellung dient nicht der Werbeprofilbildung. Die Website setzt keine Marketing-Cookies.</p>
    <h2>4. Selbst gehostete Seitenstatistik</h2>
    <p>{analytics ? "Umami ist für öffentliche Portfolio- und Blogseiten aktiviert." : "Umami ist derzeit deaktiviert."} Soweit aktiviert, werden Skript und Messanfragen über den selbst gehosteten Endpunkt auf <strong>rpcrate.com</strong> verarbeitet. Dabei sind IP-Adresse und Browserheader technisch für die Serververbindung sichtbar. Übermittelt werden öffentliche Seitenpfade und Seitentitel, aber keine URL-Parameter, Fragmente, Referrer-Texte, Formulareingaben oder selbst vergebenen Besucherkennungen. Die Integration setzt keine Analytics-Cookies. Tools und APIs sind ausgeschlossen. Do Not Track und Global Privacy Control werden respektiert. Zweck und Rechtsgrundlage: statistische Reichweitenmessung, Art. 6 Abs. 1 lit. f DSGVO.</p>
    <h2>5. Inhalte und Links Dritter</h2>
    <p>X-Beiträge werden erst nach Klick auf die Schaltfläche zum Laden eingebunden. Dabei baut der Browser Verbindungen zu X und dessen Inhaltsanbietern auf; technische Daten können auch in Staaten außerhalb der EU übertragen werden. Einige Artikel verwenden Bilder externer Anbieter, die beim Seitenaufruf technische Verbindungsdaten erhalten können. Verlinkte Drittanbieter betreiben eigenständige Websites und haben eigene Datenschutzhinweise.</p>
    <h2>6. Tool zur internen Verlinkung</h2>
    <p>Bei freiwilliger Nutzung des <Link href="/tools/internal-links">Tools zur Prüfung interner Links</Link> werden der angegebene TypeSafe-API-Schlüssel und die Zieladresse während der Analyse im Arbeitsspeicher verarbeitet. Der Crawler ruft öffentliche Seiten der Zielwebsite ab; ausgewählte extrahierte Texte werden zur Auswertung an TypeSafe übermittelt. Schlüssel, Inhalte und Report werden nicht absichtlich in Datenbanken oder im Browser-Speicher abgelegt. Für TypeSafe gelten dessen eigene Nutzungs- und Speicherbedingungen. Bitte nur Websites prüfen, für die eine Berechtigung besteht.</p>
    <h2>7. Kontaktaufnahme</h2>
    <p>Bei einer E-Mail oder der Nutzung des separat betriebenen Kontaktformulars von lkmedia verarbeiten wir die Angaben zur Beantwortung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO bei Anfragen zu Verträgen oder vorvertraglichen Maßnahmen, sonst Art. 6 Abs. 1 lit. f DSGVO. Korrespondenz wird nur so lange aufbewahrt, wie die Bearbeitung oder gesetzliche Aufbewahrungspflichten es erfordern. Für das externe Formular gilt dessen eigene Datenschutzerklärung.</p>
    <h2>8. Empfänger, Drittlandübermittlungen und Speicherdauer</h2>
    <p>Technische Dienstleister können Daten für Hosting und Auslieferung verarbeiten. Der eigene Statistik-Endpunkt und TypeSafe sind oben beschrieben. Beim Abruf externer Medien können die jeweiligen Anbieter Verbindungsdaten erhalten. Dabei sind je nach Anbieter Übermittlungen außerhalb des Europäischen Wirtschaftsraums möglich; geeignete Garantien sind jeweils mit den Anbietern zu prüfen. Personenbezogene Daten bleiben nur so lange gespeichert, wie es für den jeweiligen Zweck bzw. gesetzlich erforderlich ist.</p>
    <h2>9. Betroffenenrechte</h2>
    <p>Unter den gesetzlichen Voraussetzungen bestehen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung auf Grundlage berechtigter Interessen (Art. 15–21 DSGVO). Erteilte Einwilligungen können für die Zukunft widerrufen werden. Kontakt: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Beschwerden sind bei einer zuständigen Datenschutz-Aufsichtsbehörde möglich.</p>
    <p><em>Angaben zur Verarbeitung beruhen auf der Repository-Konfiguration; Logging, tatsächliche Aufbewahrungsfristen und die Dienstleister sind anhand der Live-Infrastruktur zu prüfen.</em></p>
  </main>;
}
