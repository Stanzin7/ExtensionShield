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
    keywords: "malicious chrome extensions, browser extension spyware, chrome extension data exfiltration, extension hijacking, detect malware extension",
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
  },
  // ===================== NEW BLOG POSTS (2026-03) =====================
  {
    slug: "best-chrome-extension-security-scanners-2026",
    title: "Best Chrome Extension Security Scanners in 2026 — Free & Paid Compared",
    description: "Compare the best chrome extension security scanners in 2026: ExtensionShield, CRXcavator, CRXplorer, and more. Features, pricing, accuracy, and which scanner is right for you.",
    date: "2026-03",
    category: "Comparison",
    keywords: "best chrome extension scanner, chrome extension security scanner 2026, CRXcavator alternative, CRXplorer alternative, extension scanner comparison, free extension scanner",
    sections: [
      {
        heading: "Why you need a Chrome extension scanner in 2026",
        body: "Chrome extensions have become the fastest-growing attack vector in 2026. With over 200,000 extensions in the Chrome Web Store and new supply-chain attacks emerging monthly, manually reviewing extension safety is no longer practical. A chrome extension security scanner automates the process — analyzing permissions, code quality, network domains, and known threats so you can decide whether to install in seconds, not hours. Whether you're an individual user, a developer shipping extensions, or an enterprise managing hundreds of employees, the right scanner can prevent data breaches, credential theft, and compliance violations."
      },
      {
        heading: "ExtensionShield — best for transparency and developer audit",
        body: "ExtensionShield offers free public scanning by URL or extension ID, with a comprehensive risk score that breaks down Security, Privacy, and Governance signals. What sets ExtensionShield apart is transparency: every finding links back to evidence, so you understand exactly why an extension scored the way it did. For developers, the Pro tier offers private CRX/ZIP upload for pre-release security audits with SAST, vulnerability scanning, and fix guidance. ExtensionShield also integrates VirusTotal threat intelligence and checks for obfuscated code, external domain connections, and Chrome Web Store policy alignment. Best for: developers who want pre-release audits, security teams who want evidence-backed reports, and users who want clear risk explanations."
      },
      {
        heading: "CRXcavator — best for enterprise-scale monitoring",
        body: "CRXcavator, built by Duo Security (now Cisco), scans the entire Chrome Web Store every three hours and assigns a numeric risk score. It's designed for enterprise IT teams who need to evaluate extensions across a large organization. CRXcavator offers an API for programmatic access, integration with Duo's broader security platform, and a policy engine for enforcing extension governance. Limitations: the scoring methodology is less transparent than ExtensionShield, and it focuses primarily on Chrome Web Store extensions (no CRX/ZIP upload). The free tier is limited, and the interface can feel enterprise-heavy for individual users."
      },
      {
        heading: "CRXplorer — best for quick AI-powered assessment",
        body: "CRXplorer, founded by bug bounty researcher Jenish Sojitra, offers free scanning with an AI-powered threat assessment layer. It generates a security score out of 100 with color-coded risk levels (Critical, High, Moderate, Safe). CRXplorer also offers a Chrome extension that scans your installed extensions in real time. Limitations: the AI assessment can feel opaque — you get a score but less visibility into why. The API is paid (starting at $5/month for 100 requests), and there's no private CRX/ZIP upload for developers. CRXplorer is strongest for bug bounty hunters and quick assessments, but less suited for compliance or governance needs."
      },
      {
        heading: "How to choose the right scanner",
        body: "Consider these factors when picking a chrome extension security scanner: (1) Transparency — can you see the evidence behind the score? (2) Coverage — does it check permissions, code quality, network domains, AND governance? (3) Developer support — can you scan private builds before release? (4) Enterprise features — does it support allowlists, monitoring, and compliance reporting? (5) Cost — is there a meaningful free tier? ExtensionShield scores highly on transparency, developer features, and governance. CRXcavator leads on enterprise integration. CRXplorer offers the fastest AI-first assessment. Try scanning the same extension across multiple tools to see which gives you the most actionable information."
      }
    ]
  },
  {
    slug: "top-10-dangerous-chrome-extension-permissions",
    title: "Top 10 Most Dangerous Chrome Extension Permissions — What Each One Means",
    description: "The 10 most dangerous Chrome extension permissions explained: what each permission lets an extension do, real-world abuse examples, and how to check permission risk before installing.",
    date: "2026-03",
    category: "Security",
    keywords: "dangerous chrome extension permissions, chrome extension permission risks, all_urls permission, activeTab permission, cookies permission, chrome extension what permissions are risky",
    sections: [
      {
        heading: "Why permissions are the first thing to check",
        body: "Chrome extension permissions define what an extension can access on your device and browser. Granting the wrong permission to a malicious extension can expose your passwords, browsing history, financial data, and personal files. Understanding the most dangerous chrome extension permissions is the single most effective way to protect yourself. Before installing any extension, review its permissions — and if you're not sure what a permission means, scan it with a tool like ExtensionShield that breaks down permission risk with evidence."
      },
      {
        heading: "1. <all_urls> — access to every website you visit",
        body: "The <all_urls> permission grants the extension access to data on every website you visit. This means it can read page content, modify what you see, intercept form submissions, and track your browsing across every site. Legitimate use cases include ad blockers and password managers, but this permission is also the most abused by malicious extensions. Always ask: does this extension actually need access to every website? A coupon finder doesn't need to read your bank's login page."
      },
      {
        heading: "2. cookies — read and write your session tokens",
        body: "The cookies permission lets an extension read, modify, and delete cookies for any domain it has host access to. This includes session tokens that keep you logged in. A malicious extension with cookie access can hijack your active sessions — logging into your Gmail, banking, or social media accounts as you. This is called session hijacking and it's one of the most damaging attacks an extension can perform."
      },
      {
        heading: "3. webRequest / webRequestBlocking — intercept all network traffic",
        body: "These permissions let an extension monitor and modify every HTTP request your browser makes. webRequestBlocking (Manifest V2) can even block or redirect requests in real time. A malicious extension could redirect your banking site to a phishing page, inject tracking pixels into every page load, or exfiltrate data by appending it to outgoing requests. In Manifest V3, this is replaced by declarativeNetRequest, which is safer but still worth checking."
      },
      {
        heading: "4. tabs — see every open tab URL and title",
        body: "The tabs permission reveals the URL and title of every tab you have open. This is a browsing history in real time. A malicious extension can track which sites you visit, when you visit them, and how long you stay. Even if an extension legitimately needs tab management, the tabs permission exposes far more information than most users realize."
      },
      {
        heading: "5. history — full browsing history access",
        body: "This permission lets an extension read your complete browser history, including URLs, visit times, and visit counts. Combined with other permissions, it gives a complete picture of your online behavior. Few extensions legitimately need this — if you see it, question why."
      },
      {
        heading: "6–10: storage, clipboardRead, downloads, nativeMessaging, and management",
        body: "6. storage/unlimitedStorage — store and retrieve large amounts of data locally; could be used to cache exfiltrated data. 7. clipboardRead — read anything you copy, including passwords and credit card numbers. 8. downloads — silently download files to your computer, a common malware delivery mechanism. 9. nativeMessaging — communicate with programs installed on your computer outside the browser, breaking the browser sandbox. 10. management — see, enable, disable, or uninstall other extensions, which can be used to disable security tools. Each of these permissions has legitimate uses, but in the wrong hands they create serious security and privacy risks. Scan any extension with ExtensionShield to see exactly which permissions it requests and whether the risk matches its stated purpose."
      }
    ]
  },
  {
    slug: "chrome-extension-privacy-risks-data-collection",
    title: "Chrome Extension Privacy Risks: What Data Extensions Collect About You",
    description: "How Chrome extensions collect your data: browsing history, keystrokes, form data, and more. Understand extension privacy risks and how to protect yourself with a privacy-focused scanner.",
    date: "2026-03",
    category: "Privacy",
    keywords: "chrome extension privacy, extension data collection, browser extension tracking, extension surveillance, chrome extension privacy risks, does chrome extension track me",
    sections: [
      {
        heading: "Extensions are the biggest privacy blind spot in your browser",
        body: "Most people carefully review app permissions on their phone but blindly click 'Add to Chrome' without reading what an extension can access. Chrome extensions can read every page you visit, capture form inputs (including passwords), access your clipboard, monitor your network requests, and even inject code into websites. A 2024 study found that over 60% of popular Chrome extensions collect more data than their stated purpose requires. This isn't just about malicious extensions — even well-intentioned extensions can over-collect data for analytics, telemetry, or monetization purposes."
      },
      {
        heading: "What data can extensions actually collect?",
        body: "Depending on permissions, a Chrome extension can collect: (1) Full browsing history — every URL you visit, when, and how often. (2) Page content — the text, images, and forms on every page, including banking and medical sites. (3) Form data and keystrokes — what you type into search bars, login forms, and message boxes. (4) Cookies and session tokens — your active login sessions. (5) Clipboard contents — anything you copy and paste. (6) Network requests — every API call and data transfer your browser makes. (7) Download history — files you download. (8) Tab and window information — what other tabs you have open. Most users don't realize that a single extension can combine these data sources to build a comprehensive profile of your online life."
      },
      {
        heading: "Real examples of extension privacy abuse",
        body: "The Honey extension (17M+ users) was investigated for tracking shopping behavior across websites and sharing data with retailers — far beyond what users expected from a 'coupon finder.' DataSpii, a campaign involving multiple extensions with 4M+ users, was found exfiltrating sensitive corporate data including tax returns, patient records, and proprietary business information — which then appeared on a paid analytics platform. The Great Suspender, with 2M+ users, was sold to an unknown buyer who injected tracking code. These aren't hypothetical scenarios — they represent the real privacy cost of trusting extensions without verification."
      },
      {
        heading: "How to protect your privacy from extensions",
        body: "First, scan every extension before installing using a privacy-focused scanner like ExtensionShield, which specifically analyzes Privacy signals including data access scope, external domains, and exfiltration patterns. Second, regularly review your installed extensions — remove any you no longer use. Third, use Chrome's built-in permission controls: go to chrome://extensions, click 'Details' on any extension, and restrict site access to 'On specific sites' or 'On click' instead of 'On all sites.' Fourth, prefer Manifest V3 extensions, which have stricter permission models. Fifth, read the extension's privacy policy — if it doesn't have one, that's a red flag."
      }
    ]
  },
  {
    slug: "how-to-remove-malicious-chrome-extensions",
    title: "How to Remove Malicious Chrome Extensions — Complete Guide (2026)",
    description: "Step-by-step guide to find and remove malicious Chrome extensions from your browser. Includes signs of infection, removal steps, and post-removal security checklist.",
    date: "2026-03",
    category: "Security",
    keywords: "remove malicious chrome extension, how to remove chrome extension malware, chrome extension virus removal, uninstall bad chrome extension, chrome extension cleanup",
    sections: [
      {
        heading: "Signs your browser has a malicious extension",
        body: "Before you remove anything, you need to identify the problem. Common signs of a malicious Chrome extension include: unexpected ads appearing on websites that don't normally show ads, your homepage or search engine changing without your consent, new toolbars or extensions you don't remember installing, slower browser performance and higher CPU usage, redirects when clicking links (especially search results), pop-ups asking you to update software or install programs, and unfamiliar processes in Chrome's Task Manager (Shift+Esc). If you notice any of these, at least one of your extensions may be compromised."
      },
      {
        heading: "Step 1: Identify suspicious extensions",
        body: "Open chrome://extensions in your browser. Review every installed extension and ask: (1) Do I remember installing this? (2) Do I still use it? (3) Does it have permissions that don't match its purpose? You can also use ExtensionShield to scan your extensions by pasting their Chrome Web Store URLs. Any extension with a high risk score should be investigated further. Pay special attention to extensions that request broad permissions like 'Read and change all your data on all websites' but serve a narrow purpose."
      },
      {
        heading: "Step 2: Remove the malicious extension",
        body: "On the chrome://extensions page, find the suspicious extension and click 'Remove.' If the Remove button is grayed out, the extension may have been installed by a policy (enterprise) or malware. In that case: (1) Check chrome://policy for any forced extensions. (2) On Windows, check the registry keys under HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist. (3) On macOS, check /Library/Managed Preferences for Chrome policy files. (4) If the extension reinstalls itself after removal, you may have a deeper malware infection — run a full system antivirus scan."
      },
      {
        heading: "Step 3: Post-removal security checklist",
        body: "After removing a malicious extension, take these steps to limit damage: (1) Change passwords for any accounts you used while the extension was installed, especially email, banking, and social media. (2) Revoke active sessions — go to your Google Account security settings and sign out of all other sessions. (3) Check for unauthorized access — review recent activity on your important accounts. (4) Clear cookies and site data in Chrome settings to invalidate any stolen session tokens. (5) Enable two-factor authentication on all important accounts if you haven't already. (6) Scan your remaining extensions with ExtensionShield to ensure no other extensions are compromised. (7) Consider resetting Chrome to factory settings (Settings > Reset settings) if you suspect deep infection."
      }
    ]
  },
  {
    slug: "manifest-v3-security-what-changes-for-chrome-extensions",
    title: "Manifest V3 Security: What Changes for Chrome Extensions in 2026",
    description: "How Manifest V3 improves Chrome extension security: permission changes, service workers, declarativeNetRequest, and what it means for extension safety and privacy.",
    date: "2026-03",
    category: "Security",
    keywords: "manifest v3 security, chrome manifest v3, MV3 extension security, manifest v3 vs v2, chrome extension manifest v3 changes, declarativeNetRequest",
    sections: [
      {
        heading: "What is Manifest V3 and why does it matter for security?",
        body: "Manifest V3 (MV3) is Google's redesign of the Chrome extension platform, replacing Manifest V2 (MV2) with stricter security controls. Google began enforcing MV3 requirements in 2024, and as of 2026, new extensions must use MV3 while existing MV2 extensions are being phased out. The changes directly impact extension security: MV3 removes capabilities that malicious extensions frequently abuse, introduces tighter permission scoping, and replaces background pages with service workers that can't maintain persistent connections to command-and-control servers. Understanding MV3 helps you evaluate extension security more effectively."
      },
      {
        heading: "Key security improvements in Manifest V3",
        body: "The most impactful security changes in MV3 are: (1) No more remotely hosted code — MV2 allowed extensions to download and execute JavaScript from external servers, which is how many malicious extensions delivered payloads after passing Chrome Web Store review. MV3 requires all code to be bundled in the extension package. (2) Service workers replace background pages — persistent background scripts that could maintain open connections to malicious servers are replaced by event-driven service workers that terminate when not in use. (3) declarativeNetRequest replaces webRequestBlocking — instead of programmatically intercepting and modifying every network request, extensions must declare their network rules statically. This prevents runtime request manipulation. (4) Narrower host permissions — MV3 encourages extensions to use activeTab (triggered by user action) instead of blanket access to all websites."
      },
      {
        heading: "What MV3 doesn't fix",
        body: "MV3 improves the security baseline but doesn't eliminate all risks. Extensions can still: access cookies and session tokens if granted permission, read and modify page content via content scripts, collect and exfiltrate browsing data through allowed network requests, and request broad permissions that users grant without understanding. Additionally, some security researchers argue that MV3's restrictions on network request interception weakened privacy-focused extensions like ad blockers, while not fully preventing determined malicious actors from finding workarounds. The lesson: MV3 is a step forward, but it doesn't replace the need for extension scanning and risk assessment."
      },
      {
        heading: "How to evaluate MV3 extensions for safety",
        body: "When evaluating a Manifest V3 extension: (1) Check if it's actually MV3 — look for 'manifest_version': 3 in the extension's manifest.json, or scan it with ExtensionShield which reports the manifest version. (2) Review permissions — even in MV3, permissions define what an extension can do. Fewer permissions is generally safer. (3) Check for content scripts — MV3 content scripts still have full access to page DOM, so they can still read form data and modify pages. (4) Look for declarativeNetRequest rules — understand what network rules the extension is applying. (5) Scan with ExtensionShield for a comprehensive risk score that accounts for MV3-specific security factors."
      }
    ]
  },
  {
    slug: "chrome-extension-security-for-remote-teams",
    title: "Chrome Extension Security for Remote Teams: A 2026 IT Guide",
    description: "How to secure browser extensions for remote and hybrid teams: policies, monitoring, allowlists, and risk assessment for Chrome extensions in distributed workforces.",
    date: "2026-03",
    category: "Enterprise",
    keywords: "chrome extension security remote teams, browser extension policy remote work, enterprise extension management, chrome extension governance, browser extension security IT teams",
    sections: [
      {
        heading: "Why remote work makes extension security harder",
        body: "Remote and hybrid work has expanded the browser attack surface dramatically. Employees install Chrome extensions on personal and work devices outside IT's visibility. Unlike office environments with managed devices and network-level controls, remote workers often have full admin rights on their machines, use personal browsers for work, and install extensions without IT approval. A single compromised extension on one employee's browser can expose corporate credentials, customer data, and internal systems. Shadow IT browser extensions — those installed without approval — represent one of the fastest-growing security gaps in distributed organizations."
      },
      {
        heading: "Building a browser extension policy for distributed teams",
        body: "An effective browser extension policy for remote teams should include: (1) An extension allowlist — define which extensions are approved for work use, evaluated against a chrome extension risk score. (2) Category-based rules — allow productivity extensions with low risk scores, block extensions in high-risk categories (VPN, cryptocurrency, download managers). (3) Permission thresholds — automatically flag or block extensions requesting dangerous permissions like <all_urls>, cookies, or webRequest. (4) Update monitoring — require re-evaluation when approved extensions push updates that change permissions. (5) BYOD guidelines — define rules for personal devices accessing corporate resources. ExtensionShield Enterprise supports all of these through centralized monitoring and governance."
      },
      {
        heading: "Implementation: from audit to enforcement",
        body: "Start with an audit: use ExtensionShield to scan all extensions currently in use across your organization. Categorize them into approved, under-review, and blocked. Communicate the policy clearly — employees are more likely to comply when they understand that extension security protects their personal data too, not just corporate assets. Deploy Chrome Enterprise policies (ExtensionInstallBlocklist, ExtensionInstallAllowlist) to enforce the allowlist. For unmanaged devices (BYOD), provide a self-service scanning link where employees can check extensions before installing. Schedule quarterly extension audits and integrate extension risk assessment into your security review process."
      },
      {
        heading: "Monitoring and incident response",
        body: "Continuous monitoring is essential because extensions change after installation. Set up alerts for: new extensions installed on managed devices, approved extensions requesting new permissions after an update, extensions communicating with domains on threat intelligence blocklists, and extensions with risk scores that increase above your threshold. When an incident occurs, your response should include: immediately blocking the extension across all managed devices, resetting credentials for any accounts accessed through the affected browser, and reviewing audit logs for data exfiltration signals. ExtensionShield provides real-time monitoring and audit-ready reports to support both ongoing governance and incident investigation."
      }
    ]
  },
  {
    slug: "chrome-web-store-review-process-security-gaps",
    title: "Chrome Web Store Review Process: Security Gaps You Should Know About",
    description: "How Chrome Web Store reviews extensions, what the review process misses, and why you can't rely on store approval alone for extension security. Real examples of approved malicious extensions.",
    date: "2026-03",
    category: "Security",
    keywords: "chrome web store review process, chrome web store security, extension review bypass, chrome store malware, how does google review extensions, chrome web store safety",
    sections: [
      {
        heading: "What happens when an extension is submitted to the Chrome Web Store",
        body: "When a developer submits an extension to the Chrome Web Store, Google runs automated and manual checks before approval. Automated systems scan for known malware signatures, policy violations (like deceptive behavior), and obvious security issues. Some extensions receive additional manual review, particularly those requesting sensitive permissions. The review process typically takes a few hours to a few days. Google has significantly improved its review process over the years, adding machine learning-based detection and stricter policy enforcement. But the process has fundamental limitations that users need to understand."
      },
      {
        heading: "What the review process misses",
        body: "The Chrome Web Store review is a point-in-time assessment of the submitted code. It cannot catch: (1) Post-approval attacks — extensions that pass review clean, then push malicious updates. The 2026 ownership transfer attacks (QuickLens, ShotBird) demonstrate this clearly. (2) Runtime-loaded code — in Manifest V2, extensions could download and execute code from external servers after installation, completely bypassing the review. MV3 restricts this, but doesn't eliminate all vectors. (3) Slow-burn data collection — extensions that gradually expand data collection over multiple updates, staying under the radar. (4) Supply chain attacks — legitimate extensions acquired by malicious actors, where the extension's reputation and user base are weaponized. (5) Social engineering — extensions that behave normally for reviewers but activate malicious behavior based on user geography, time, or specific conditions."
      },
      {
        heading: "Real examples of approved malicious extensions",
        body: "The evidence is clear that Chrome Web Store approval does not guarantee safety. In 2024, 33 Chrome extensions with 87 million combined users were found to contain obfuscated data-stealing code. In early 2026, the ownership-transfer attack wave compromised extensions including QuickLens (Featured badge), ShotBird, and Palette Creator (100,000+ users). The DataSpii campaign involved extensions with over 4 million users that exfiltrated sensitive corporate data. The Great Suspender (2M+ users) passed review for years before being sold and weaponized. Each of these extensions was approved by Google and available in the Chrome Web Store when the malicious behavior was discovered."
      },
      {
        heading: "How to protect yourself beyond the Chrome Web Store",
        body: "The Chrome Web Store badge and star ratings are starting points, not guarantees. To actually verify extension safety: (1) Scan with an independent tool — use ExtensionShield to get a risk score based on permissions, code analysis, threat intelligence, and governance signals. Unlike the Chrome Web Store review, this is a comprehensive, evidence-based assessment. (2) Re-scan after updates — the Chrome Web Store reviews updates, but you should independently verify that updates don't introduce risky new permissions or behavior. (3) Check ownership history — has the extension changed developers recently? ExtensionShield flags governance signals that indicate ownership or policy changes. (4) Limit permissions — after installing, go to chrome://extensions, click Details on the extension, and restrict its site access to 'On specific sites' where possible."
      }
    ]
  },
  {
    slug: "chrome-extension-vs-firefox-addon-security",
    title: "Chrome Extension vs Firefox Add-on Security: Which Browser is Safer?",
    description: "Compare Chrome extension and Firefox add-on security models: permission systems, review processes, and which browser offers better protection from malicious extensions.",
    date: "2026-03",
    category: "Comparison",
    keywords: "chrome extension vs firefox addon security, browser extension security comparison, firefox addon safety, chrome vs firefox extensions, which browser extensions are safer",
    sections: [
      {
        heading: "Extension security is a browser's weakest link",
        body: "Both Chrome and Firefox have invested heavily in browser security — sandboxing, site isolation, and exploit mitigations. But extensions bypass many of these protections by design. When you grant an extension access to 'all your data on all websites,' you're giving it more access than most websites ever get. The question isn't whether extensions create risk — it's which browser's extension platform manages that risk better. This comparison looks at Chrome and Firefox side by side on permissions, review processes, and user controls."
      },
      {
        heading: "Permission models compared",
        body: "Chrome's Manifest V3 represents a significant tightening of the permission model. Key improvements include the shift from background pages to service workers (reducing persistent access), declarativeNetRequest replacing webRequestBlocking (limiting runtime network manipulation), and the removal of remotely hosted code. Firefox's extension model (based on WebExtensions, which is compatible with Chrome's API) has adopted many of the same APIs but maintains some MV2-era capabilities. Firefox still supports webRequest blocking for add-ons, which is valuable for ad blockers but also available to malicious add-ons. Firefox does require extensions to use a stricter Content Security Policy. Overall, Chrome's MV3 is slightly more restrictive, while Firefox gives add-ons more power — a trade-off between functionality and security."
      },
      {
        heading: "Review processes compared",
        body: "Chrome Web Store uses a combination of automated scanning and selective manual review. Extensions requesting sensitive permissions get more scrutiny, and Google uses machine learning to detect deceptive behavior patterns. Firefox's add-on review process (addons.mozilla.org) uses a similar automated + manual approach but historically has had stricter manual review for featured add-ons. Firefox also performs source code review for some extensions. However, both platforms share the same fundamental weakness: they review extensions at submission time, and post-approval updates can introduce malicious behavior. Neither platform can fully prevent supply chain attacks or ownership transfer compromises."
      },
      {
        heading: "User controls and transparency",
        body: "Firefox offers more granular user controls out of the box. Users can run extensions in 'private browsing' mode selectively, Firefox shows clear permission prompts during installation with plain-language descriptions, and Firefox's about:addons page provides detailed permission listings. Chrome has improved with per-extension site access controls and Chrome://extensions detail views, but Firefox's permission management is more intuitive for non-technical users. For organizations, both browsers support managed extension policies, but Chrome Enterprise has more granular policy controls. The bottom line: Chrome's MV3 is more restrictive at the platform level (better against malicious extensions), while Firefox gives users more visibility and control (better for informed users). Regardless of browser, scanning extensions with a tool like ExtensionShield provides an independent risk assessment that neither browser's built-in protections offer."
      }
    ]
  },
  {
    slug: "chrome-extension-supply-chain-attacks-2026",
    title: "Chrome Extension Supply Chain Attacks in 2026: Timeline, Tactics, and Defense",
    description: "Complete timeline of Chrome extension supply chain attacks in 2026. How attackers buy, compromise, and weaponize trusted extensions — and how to defend against extension supply chain threats.",
    date: "2026-03",
    category: "Security",
    keywords: "chrome extension supply chain attack, extension supply chain security, chrome extension compromised, extension hijacking 2026, browser extension attack vector",
    sections: [
      {
        heading: "2026: the year of the extension supply chain attack",
        body: "2026 has seen an unprecedented wave of Chrome extension supply chain attacks. Unlike traditional malware that users must be tricked into installing, supply chain attacks exploit trust: attackers compromise or acquire extensions that users already have installed, then push malicious updates to the existing user base. The attacks are effective because Chrome extensions auto-update silently — users receive new code without any prompt or notification. This makes browser extensions one of the most dangerous supply chain vectors in the modern software ecosystem, alongside package managers (npm, PyPI) and CI/CD pipelines."
      },
      {
        heading: "Attack timeline: what happened and when",
        body: "January 2026: Security researchers at Annex Security begin tracking a pattern of Chrome extensions being listed for sale on developer marketplaces. February 2026: Multiple extensions are identified as purchased by entities with no prior Chrome Web Store presence. Code analysis reveals obfuscated payloads and connections to known command-and-control infrastructure. March 2026: The Hacker News reports confirmed cases — QuickLens (7,000 users) and ShotBird (800 users) — both acquired and weaponized. ShotBird, which had a Chrome Web Store 'Featured' badge, used a fake Chrome update prompt to deliver malware via PowerShell. Palette Creator (100,000+ users) found communicating with RedDirection campaign infrastructure. The wave continues as researchers identify additional compromised extensions across productivity, screenshot, and utility categories."
      },
      {
        heading: "How the attacks work technically",
        body: "Supply chain attackers use several techniques: (1) C2 polling — the extension checks an external server on a timer (often every 5 minutes) for JavaScript payloads to execute. The malicious code never appears in the extension source, making static analysis harder. (2) CSP stripping — the extension removes Content Security Policy headers from HTTP responses, enabling injected scripts to make cross-origin requests. (3) Pixel beacon delivery — a hidden 1x1 GIF image loads a script from an external domain, disguised as a tracking pixel. (4) Fake update prompts — the extension displays a fake browser update dialog that runs system commands when clicked. (5) Form hooking — injected scripts attach to every input field on every page, capturing passwords, credit card numbers, and other sensitive data in real time. These techniques are designed to evade both Chrome Web Store review and basic security scanning."
      },
      {
        heading: "How to defend against extension supply chain attacks",
        body: "Defense requires continuous monitoring, not just one-time assessment: (1) Scan all extensions regularly — use ExtensionShield to check extensions not just at install time but after every update. Our scanner detects obfuscated code, suspicious network domains, and permission changes that indicate compromise. (2) Monitor ownership changes — ExtensionShield's governance signals flag when an extension's developer account changes, a leading indicator of supply chain compromise. (3) Limit extension sprawl — every installed extension is an attack surface. Remove extensions you don't actively use. (4) Restrict auto-updates for critical environments — enterprises should gate extension updates through a review process. (5) Use enterprise policies — Chrome Enterprise policies can enforce extension allowlists and block known-bad extensions. (6) Join the community — security is a team effort. Report suspicious extensions through ExtensionShield and share findings with the security community."
      }
    ]
  },
  {
    slug: "what-does-a-chrome-extension-risk-score-mean",
    title: "What Does a Chrome Extension Risk Score Mean? How to Read Security Reports",
    description: "Learn how to read and understand Chrome extension risk scores: what the numbers mean, how they're calculated, and how to make install decisions based on security scan results.",
    date: "2026-03",
    category: "Security",
    keywords: "chrome extension risk score, extension security score meaning, how to read extension security report, chrome extension safety rating, extension risk assessment explained",
    sections: [
      {
        heading: "Why risk scores exist",
        body: "With over 200,000 Chrome extensions available, users need a quick way to assess safety before installing. A chrome extension risk score condenses a complex security analysis — permissions, code quality, network behavior, threat intelligence, and governance — into a single number or rating. But risk scores are only useful if you understand what they measure and what they don't. Not all scanners calculate risk the same way, and a '75/100' on one tool doesn't mean the same thing as '75/100' on another."
      },
      {
        heading: "How ExtensionShield calculates risk scores",
        body: "ExtensionShield's risk score is built from three pillars: Security, Privacy, and Governance. Security checks include static code analysis (SAST), VirusTotal threat intelligence, obfuscation detection, and known malware patterns. Privacy checks analyze permissions scope, data access capabilities, external domain connections, and potential exfiltration vectors. Governance checks evaluate Chrome Web Store policy alignment, disclosure accuracy, and extension metadata consistency. Each pillar contributes to the overall score, and you can drill into individual findings with evidence — so you don't just see a number, you see exactly what drove it."
      },
      {
        heading: "How to interpret the score",
        body: "A high risk score doesn't automatically mean an extension is malicious — it means it has elevated risk that you should investigate. For example, an ad blocker will legitimately request broad permissions (it needs access to web pages to block ads), which raises its risk score. The key is whether the risk matches the extension's stated purpose. When reviewing a scan report: (1) Start with the overall score for a quick assessment. (2) Check which pillar (Security, Privacy, Governance) contributed most to the risk. (3) Review the individual findings — look for red flags like obfuscated code, connections to suspicious domains, or permissions that don't match the extension's purpose. (4) Compare the risk to alternatives — scan similar extensions and see if this one is riskier than its competitors."
      },
      {
        heading: "Common risk score patterns and what they mean",
        body: "Low risk (0-30): Minimal permissions, no suspicious code or network patterns, clean threat intelligence, consistent governance. These extensions request only what they need and behave transparently. Medium risk (30-60): Some elevated signals — broader permissions than strictly necessary, connections to ad networks or analytics, or minor governance inconsistencies. Most popular extensions fall here. Worth reviewing the findings but often acceptable. High risk (60-80): Significant concerns — very broad permissions, obfuscated code sections, connections to uncommon or suspicious domains, or governance red flags. Install only if you've reviewed the evidence and accept the risk. Critical risk (80-100): Major red flags — known malware signatures, active threat intelligence matches, extreme permission scope, or clear evidence of deceptive behavior. Avoid unless you have a specific, informed reason to proceed. Remember: a risk score is a starting point for investigation, not a final verdict. Use it alongside your own judgment."
      }
    ]
  },
  {
    slug: "browser-extension-security-best-practices-2026",
    title: "Browser Extension Security Best Practices for 2026",
    description: "Essential browser extension security best practices for 2026: permission management, update hygiene, enterprise policies, and continuous monitoring for Chrome, Firefox, and Edge extensions.",
    date: "2026-03",
    category: "Security",
    keywords: "browser extension security best practices, chrome extension safety tips, extension security checklist, how to stay safe with browser extensions, secure browser extensions 2026",
    sections: [
      {
        heading: "The extension security landscape in 2026",
        body: "Browser extensions are more powerful — and more targeted — than ever. The 2026 supply chain attack wave, combined with increasing extension use in remote work environments, has made extension security a board-level concern for enterprises and a daily safety issue for individuals. These best practices reflect the current threat landscape and incorporate lessons from real attacks documented throughout the year."
      },
      {
        heading: "For individual users: 7 essential practices",
        body: "1. Scan before you install. Use a tool like ExtensionShield to check any extension's risk score, permissions, and threat intelligence before installing. It takes less than 60 seconds and can prevent weeks of damage. 2. Read permissions carefully. If a weather widget wants access to all your browsing data, that's a red flag. Permissions should match the extension's purpose. 3. Minimize your extensions. Every installed extension is an attack surface. Remove any you don't actively use. 4. Restrict site access. After installing an extension, go to chrome://extensions > Details and change 'Site access' from 'On all sites' to 'On specific sites' or 'On click' where possible. 5. Watch for ownership changes. If an extension you use is acquired by a new developer, re-scan it immediately. 6. Keep your browser updated. Browser updates include security patches that protect against extension-based attacks. 7. Enable two-factor authentication. Even if an extension steals your password, 2FA provides a second line of defense."
      },
      {
        heading: "For developers: build secure extensions",
        body: "1. Use Manifest V3. MV3 provides better security defaults — service workers, declarativeNetRequest, and no remotely hosted code. 2. Request minimum permissions. Only request what your extension needs. Use activeTab instead of <all_urls> when possible. Use optional_permissions for features that not every user needs. 3. Audit your own code. Use ExtensionShield's Pro CRX/ZIP upload to scan your extension before submitting to the Chrome Web Store. Catch vulnerabilities, policy issues, and risk signals before Google's review. 4. Implement a Content Security Policy. Restrict script sources and disable inline scripts to prevent injection attacks. 5. Keep dependencies updated. Vulnerable npm packages in your extension are a supply chain risk. 6. Publish a clear privacy policy. Transparency builds trust and is required by Chrome Web Store policies."
      },
      {
        heading: "For enterprises: governance and monitoring",
        body: "1. Establish a browser extension policy. Define approved, restricted, and blocked extension categories based on risk scores and permission thresholds. 2. Deploy Chrome Enterprise policies. Use ExtensionInstallAllowlist and ExtensionInstallBlocklist to enforce your policy on managed devices. 3. Audit existing extensions. Scan all currently installed extensions across your organization using ExtensionShield. You may find shadow IT extensions that pose unacceptable risk. 4. Monitor continuously. Extensions change with updates. Set up continuous monitoring to detect permission changes, new network connections, and risk score increases. 5. Integrate with your security stack. Feed extension risk data into your SIEM, vulnerability management, or compliance reporting tools. 6. Train employees. Help workers understand that extension permissions are as important as app permissions on their phones. Provide a self-service scanning link so they can check extensions themselves."
      }
    ]
  },
  {
    slug: "crxplorer-alternative-extension-scanner",
    title: "CRXplorer Alternative: Why Teams Are Switching to ExtensionShield",
    description: "Looking for a CRXplorer alternative? Compare ExtensionShield vs CRXplorer: transparent scoring, SAST code analysis, governance, and free CRX/ZIP upload for developers.",
    date: "2026-03",
    category: "Comparison",
    keywords: "CRXplorer alternative, CRXplorer vs ExtensionShield, better than CRXplorer, chrome extension scanner alternative, extension security tool comparison",
    sections: [
      {
        heading: "Why teams look for CRXplorer alternatives",
        body: "CRXplorer is a capable chrome extension scanner built by a respected bug bounty researcher. It offers AI-powered risk scoring and a Chrome extension for real-time scanning. So why are security teams looking for alternatives? Three common reasons: (1) Scoring transparency — CRXplorer's AI-driven score is fast but opaque. Teams need to understand exactly why an extension scored a certain way, especially for compliance and audit purposes. (2) Developer workflow — CRXplorer doesn't support private CRX/ZIP upload for pre-release security audits. Developers building extensions need to scan their builds before Chrome Web Store submission. (3) Governance and compliance — CRXplorer focuses on security signals but doesn't provide governance analysis (policy alignment, disclosure accuracy, compliance reporting) that enterprises require."
      },
      {
        heading: "ExtensionShield vs CRXplorer: feature comparison",
        body: "Free public scan: Both tools offer free scanning by Chrome Web Store URL or extension ID. Risk scoring: CRXplorer uses an AI-driven score out of 100. ExtensionShield provides a multi-pillar score (Security + Privacy + Governance) with evidence linked to each finding — you see exactly what contributed to the score and can click into the details. Code analysis: ExtensionShield runs SAST (Static Application Security Testing) to analyze extension code for vulnerabilities, suspicious patterns, and obfuscation. CRXplorer's code analysis relies on its AI model. Developer audit: ExtensionShield Pro supports private CRX/ZIP upload for pre-release security audits with fix guidance. CRXplorer does not offer this. Threat intelligence: Both integrate security data sources. ExtensionShield uses VirusTotal integration. Governance: ExtensionShield checks Chrome Web Store policy alignment, disclosure accuracy, and metadata consistency. CRXplorer does not include governance analysis. Enterprise features: ExtensionShield offers allowlist governance, monitoring, and audit-ready reports. CRXplorer offers API access starting at $5/month."
      },
      {
        heading: "When to use each tool",
        body: "Use CRXplorer if: you need a quick AI-driven risk assessment, you're a bug bounty hunter doing rapid reconnaissance, or you want a Chrome extension that shows risk scores on the Web Store page. Use ExtensionShield if: you need transparent, evidence-based scoring for compliance, you're a developer who wants to audit CRX/ZIP builds before release, you need governance analysis alongside security and privacy, or you're an enterprise team managing extension risk at scale. Many security professionals use both tools — a quick CRXplorer check for initial triage, then a deep ExtensionShield scan for detailed evidence and compliance documentation."
      },
      {
        heading: "Try ExtensionShield free",
        body: "Scan any Chrome extension for free at extensionshield.com/scan. Paste a Chrome Web Store URL and get a comprehensive risk report in under 60 seconds — with Security, Privacy, and Governance breakdowns, evidence for every finding, and actionable recommendations. For developers, sign in to upload private CRX/ZIP builds for pre-release security audits. For enterprises, explore our governance and monitoring features at extensionshield.com/enterprise."
      }
    ]
  }
];

export const getBlogPostBySlug = (slug) =>
  blogPosts.find((p) => p.slug === slug) || null;
