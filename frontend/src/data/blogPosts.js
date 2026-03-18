/**
 * SEO-focused blog posts (long-tail keywords).
 * Each slug is used in route path /blog/:slug and in sitemap.
 */
export const blogPosts = [
  {
    slug: "chrome-extension-ownership-transfer-risk",
    title: "Chrome Extensions Turned Malicious After Ownership Transfer — What Every User Needs to Know",
    description: "Real 2026 cases of Chrome extensions turning malicious after ownership transfer: how attackers hijack trusted extensions, inject code, and steal your data — and how to stay safe with a chrome extension security scanner.",
    date: "2026-03",
    category: "Security",
    sections: [
      {
        heading: "The new threat: buying your way in",
        body: "A disturbing new attack pattern emerged in early 2026: threat actors are purchasing trusted Chrome extensions from their original developers, then silently pushing malicious updates to the existing user base. Because users already trust and have installed the extension, they receive the malicious update automatically — with no warning. Two confirmed cases were reported by The Hacker News in March 2026: QuickLens – Search Screen with Google Lens (7,000 users) and ShotBird – Scrolling Screenshots & Editor (800 users). In both cases, the extensions were listed for sale on extension marketplaces shortly after launch, then acquired by attackers who injected harmful payloads. This is a chrome extension supply chain attack hiding in plain sight."
      },
      {
        heading: "How the malicious code works — and why it's hard to detect",
        body: "What makes these ownership-transfer attacks especially dangerous is their stealth. In the QuickLens case, security researcher John Tuckner of Annex Security found that the malicious code never appeared in the extension's source files. Instead, the extension polled an external command-and-control (C2) server every five minutes to receive JavaScript payloads, stored them in local browser storage, and executed them on every page load by loading a hidden 1×1 pixel GIF. The extension also stripped security headers like X-Frame-Options from HTTP responses, bypassing Content Security Policy (CSP) protections and allowing injected scripts to make cross-domain requests. ShotBird took a different approach: it displayed a fake Google Chrome update prompt. Clicking it opened a ClickFix-style page that launched a PowerShell command, downloading malware named 'googleupdate.exe' — which then hooked all input fields on every page to steal passwords, card numbers, PINs, and session tokens. Static chrome extension security scanners that only read the source files at install time cannot catch runtime-delivered payloads like these."
      },
      {
        heading: "Why even 'Featured' extensions can be compromised",
        body: "ShotBird received Chrome Web Store's 'Featured' badge in January 2025 — a trust signal many users rely on. Yet it was still transferred to a malicious actor and weaponised. Palette Creator, with over 100,000 users, was also found communicating with known malicious infrastructure from a campaign called RedDirection. The Chrome Web Store badge system and review process cannot protect you after an extension changes hands. This means the best defence is scanning extensions regularly — not just at install time — and re-scanning after updates. Tools like ExtensionShield provide a chrome extension risk score, detect obfuscated code, flag suspicious network domains, and alert you to permission changes introduced in updates, helping you catch extension hijacking via update before it impacts you."
      },
      {
        heading: "How to protect yourself and your organisation",
        body: "First, use a chrome extension security scanner like ExtensionShield to check any extension before installing — paste the Chrome Web Store URL and get a full risk report in under 60 seconds, covering permissions, SAST, VirusTotal signals, and governance. Second, re-scan extensions after major updates, especially if you notice behaviour changes. Third, reduce extension sprawl: every extension is a potential attack surface. Enterprises should enforce a browser extension allowlist policy and use extension compliance monitoring to detect ownership changes and policy violations at scale. Fourth, disable automatic extension updates for business-critical browser profiles, or use policies that gate updates through an internal review process. The 2026 ownership-transfer wave is a reminder that trusting an extension once is not enough — continuous monitoring is now essential."
      }
    ]
  },
  {
    slug: "how-to-check-chrome-extension-permissions",
    title: "How to Check Chrome Extension Permissions Safely",
    description: "Learn how to check chrome extension permissions safely before installing. What to look for, which permissions are risky, and how ExtensionShield helps you audit extension security.",
    date: "2026-02",
    category: "Security",
    sections: [
      {
        heading: "Why checking permissions matters",
        body: "Chrome extensions can request access to your tabs, browsing history, clipboard, and more. Checking chrome extension permissions safely helps you avoid extensions that can read sensitive data or change pages without your knowledge. Use the Chrome Web Store detail page and the extension's permission list, then cross-check with a chrome extension security scanner like ExtensionShield for a full risk assessment."
      },
      {
        heading: "What to look for",
        body: "Look for broad host permissions (e.g. <all_urls>), access to storage or cookies, and optional_host_permissions in Manifest V3. Our chrome extension permissions checker and chrome extension risk score give you a clear picture before you install."
      },
      {
        heading: "Next steps",
        body: "Paste any Chrome Web Store URL into ExtensionShield to get a chrome extension risk score, permission breakdown, and audit chrome extension security report in under a minute."
      }
    ]
  },
  {
    slug: "how-to-audit-chrome-extension-before-installing",
    title: "How to Audit a Chrome Extension Before Installing",
    description: "Step-by-step guide to audit a chrome extension before installing: permissions, risk score, and how to check if a Chrome extension is safe using a browser extension security scanner.",
    date: "2026-02",
    category: "Security",
    sections: [
      {
        heading: "Before you install",
        body: "Auditing a chrome extension before installing reduces the risk of malware, spyware, and privacy violations. Use a browser extension security scanner to get a chrome extension risk score, review requested permissions, and check for known threats. ExtensionShield combines static analysis, VirusTotal, and governance signals so you can check if a Chrome extension is safe."
      },
      {
        heading: "What an audit should cover",
        body: "A good audit covers: permission risk, code quality (SAST), obfuscation, external domains and data exfiltration signals, publisher reputation, and compliance with store policies. Our extension security analysis tool provides all of this in one report."
      },
      {
        heading: "Try it",
        body: "Scan any extension at ExtensionShield for free. You'll get an overall chrome extension risk score plus Security, Privacy, and Governance breakdowns—so you can audit chrome extension security in one place."
      }
    ]
  },
  {
    slug: "enterprise-browser-extension-risk-management",
    title: "Enterprise Browser Extension Risk Management",
    description: "How to run a browser extension risk management program: allowlist policy, compliance monitoring, shadow IT browser extensions, and chrome enterprise extension security with ExtensionShield.",
    date: "2026-02",
    category: "Enterprise",
    sections: [
      {
        heading: "Why enterprises need extension risk management",
        body: "Shadow IT browser extensions—installations outside of IT approval—create compliance and security gaps. A browser extension risk management program with a clear browser extension allowlist policy and extension permissions audit for employees helps you manage chrome extensions in enterprise and reduce exposure to malicious chrome extension campaigns and browser extension spyware."
      },
      {
        heading: "Key components",
        body: "Implement browser extension compliance monitoring, define a browser extension allowlist policy, and use a chrome extension risk score tool to evaluate extensions before allowlisting. Zero trust browser extension security means verifying every extension against your policy and re-scanning when extensions update. ExtensionShield Enterprise supports extension governance and audit-ready reporting."
      },
      {
        heading: "Getting started",
        body: "Request an Enterprise pilot at ExtensionShield for monitoring, allow/block governance, and extension risk assessment at scale. We help IT and security teams with chrome enterprise extension security and extension permissions audit for employees."
      }
    ]
  },
  {
    slug: "how-to-detect-malicious-chrome-extensions",
    title: "How to Detect Malicious Chrome Extensions",
    description: "Signs of malicious chrome extensions, browser extension spyware, and how to detect data exfiltration and extension hijacking. Use a chrome extension security scanner to check if an extension is safe.",
    date: "2026-02",
    category: "Security",
    sections: [
      {
        heading: "Signs of malicious extensions",
        body: "Malicious chrome extension campaigns and browser extension spyware often rely on broad permissions, obfuscated code, or extension hijacked via update. Chrome extension data exfiltration signs include requests to external domains you don't recognize, access to cookies or session storage, and permission combinations that allow reading and sending data. Extension session hijacking cookies is a real risk when extensions have cookie or storage access."
      },
      {
        heading: "How scanners help",
        body: "A chrome extension security scanner that uses SAST, VirusTotal, and permission analysis can flag suspicious patterns before you install. ExtensionShield provides a chrome extension risk score and highlights security, privacy, and governance issues so you can detect malicious chrome extensions and avoid extension hijacked via update scenarios."
      },
      {
        heading: "Stay protected",
        body: "Scan extensions before installing and re-scan after major updates. Use our scan chrome extension for malware workflow to get a report in under a minute and check if a chrome extension is safe."
      }
    ]
  }
];

export const getBlogPostBySlug = (slug) =>
  blogPosts.find((p) => p.slug === slug) || null;
