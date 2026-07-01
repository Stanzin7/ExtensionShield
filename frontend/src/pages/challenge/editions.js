/**
 * Challenge editions — single source of truth.
 *
 * The /challenge hub lists these as cards; each edition renders its full brief
 * at /challenge/<slug> via ChallengeEditionPage. To add a future edition:
 *   1. add an object here,
 *   2. add a static route `/challenge/<slug>` in routes.jsx,
 *   3. (optional) mark older editions status: "Closed".
 *
 * Slugs are host+year (the durable differentiator) — the challenge name repeats
 * across editions, so it must not be the slug.
 */

export const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/extension-shield/lgfembekgpcfapeemgalpeefnlikpobd";

export const EDITIONS = [
  {
    slug: "nexus-spring-2026",
    edition: "Edition 2",
    title: "Threat Report Challenge",
    host: "Nexus Spring of Code · Hackathon 2.0",
    status: "Active",
    statusVariant: "active",
    summary:
      "Choose real Chrome Web Store extensions, investigate the evidence, and turn what you find into a fair, evidence-backed threat report.",
    // Fill in when confirmed — left blank so no placeholder date is published.
    schedule: { startDate: "", endDate: "" },
    seo: {
      title: "Threat Report Challenge — Nexus Spring of Code (Hackathon 2.0) | ExtensionShield",
      description:
        "The ExtensionShield Threat Report Challenge at Nexus Spring of Code (Hackathon 2.0): investigate real Chrome extensions, classify risk on the evidence, and submit an evidence-backed report. Free to scan, no coding required.",
    },
    content: {
      lede: "Secure yourself from harmful browser extensions.",
      intro:
        "Some browser extensions request powerful permissions that may access your browsing activity or personal data, depending on how they work. Learn to spot warning signs, investigate responsibly, and help people make safer browser choices.",
      playbookHeading: "Make the report useful, fair, and hard to ignore.",
      playbookIntro:
        "The strongest reports explain both what the evidence shows and what it does not. Risk is not a guess — support every recommendation with verifiable facts.",
      howItStarts: [
        { n: "01", title: "Scan", color: "#e07b2e", icon: "search", text: "Scan extensions you use, or paste any Chrome Web Store URL. No account needed to scan." },
        { n: "02", title: "Investigate", color: "#1f9d57", icon: "eye", text: "Review permissions, privacy signals, developer details, reviews, and observable evidence." },
        { n: "03", title: "Report", color: "#2f6fd0", icon: "doc", text: "Classify the risk and make a proportional recommendation you can defend." },
      ],
      mission: [
        { n: 1, title: "Choose", text: "Pick 5–10 Chrome Web Store extensions. Popular or previously scanned ones are allowed." },
        { n: 2, title: "Scan", text: "Scan each with ExtensionShield — in the extension as you browse, or via the web scanner." },
        { n: 3, title: "Inspect", text: "Review permissions, privacy policy, developer, reviews, and observable evidence." },
        { n: 4, title: "Classify", text: "Assign a risk level based on the evidence you gathered." },
        { n: 5, title: "Save & submit", text: "Sign in to save your work, export your report, and submit your official entry." },
      ],
      risks: [
        { level: "Low", rec: "Allow", variant: "low", text: "Limited access and clear privacy signals." },
        { level: "Medium", rec: "Review", variant: "medium", text: "Broader access or unresolved questions." },
        { level: "High", rec: "Block", variant: "high", text: "Sensitive access or material trust gaps." },
        { level: "Critical", rec: "Report", variant: "critical", text: "Strong, documented evidence of harmful behavior." },
      ],
      riskNote:
        "Risk reflects your evidence-based judgment. A scan signals concerns to investigate — it does not by itself prove an extension is malicious.",
      judges: [
        { title: "Accuracy", text: "Factually correct and proportionate." },
        { title: "Evidence", text: "Screenshots, permissions, logs, sources." },
        { title: "Analysis", text: "Why the signal matters." },
        { title: "Recommendation", text: "A practical next step." },
        { title: "Presentation", text: "Clear, structured, easy to follow." },
      ],
      features: [
        { title: "Scan as you browse", text: "Inspect extensions right where you find them." },
        { title: "Save to your workspace", text: "Keep all your candidates in one place." },
        { title: "Finish your report online", text: "Your saved extensions are ready when you export your final report." },
      ],
      integrity:
        "Same extension, your own work. You may analyze the same extension as another participant — your scan, saved report, written analysis, screenshots, and recommendation must be your own. Signing in links your work to you, so judging stays fair.",
      prizes:
        "Standout submissions may also lead to open-source work, research, community leadership, or an internship, where applicable.",
    },
  },
];

export const getEdition = (slug) => EDITIONS.find((e) => e.slug === slug);
