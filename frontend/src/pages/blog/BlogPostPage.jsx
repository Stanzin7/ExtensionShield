import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import { getBlogPostBySlug, blogPosts } from "../../data/blogPosts";
import "../compare/ComparePage.scss";
import "./BlogPostPage.scss";

const CANONICAL_DOMAIN = "https://extensionshield.com";

const BlogPostPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.replace(/^\/blog\/?/, "").replace(/\/$/, "");
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <div className="blog-post-page">
        <div className="compare-container">
          <p>Post not found.</p>
          <Link to="/blog">Back to blog</Link>
        </div>
      </div>
    );
  }

  // Structured data: Article schema for Google rich results
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "author": {
      "@type": "Organization",
      "name": "ExtensionShield",
      "url": CANONICAL_DOMAIN
    },
    "publisher": {
      "@type": "Organization",
      "name": "ExtensionShield",
      "url": CANONICAL_DOMAIN,
      "logo": {
        "@type": "ImageObject",
        "url": `${CANONICAL_DOMAIN}/extension-shield-logo.png`
      }
    },
    "datePublished": `${post.date}-01`,
    "dateModified": `${post.date}-15`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${CANONICAL_DOMAIN}/blog/${post.slug}`
    },
    "image": `${CANONICAL_DOMAIN}/og.png`,
    "articleSection": post.category,
    "keywords": post.keywords || post.description
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${CANONICAL_DOMAIN}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${CANONICAL_DOMAIN}/blog` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${CANONICAL_DOMAIN}/blog/${post.slug}` }
    ]
  };

  // Get related posts (same category, different slug)
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        pathname={`/blog/${post.slug}`}
        ogType="article"
        schema={[articleSchema, breadcrumbSchema]}
        keywords={post.keywords}
      />

      <div className="blog-post-page">
        <div className="compare-container">
          <button type="button" className="compare-back" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden>/</span>
            <Link to="/blog">Blog</Link>
            <span aria-hidden>/</span>
            <span>{post.title}</span>
          </nav>

          <header className="compare-header">
            <span className="blog-post-meta">
              {post.category} · {post.date}
            </span>
            <h1>{post.title}</h1>
            <p>{post.description}</p>
          </header>

          <div className="compare-prose">
            {post.sections.map((section, idx) => (
              <section key={idx}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <div className="compare-cta">
            <Link to="/scan">Scan an extension with ExtensionShield →</Link>
          </div>

          {/* Related posts for internal linking */}
          {relatedPosts.length > 0 && (
            <div className="compare-links" style={{ marginTop: "2rem" }}>
              <h3>Related articles</h3>
              <ul>
                {relatedPosts.map((rp) => (
                  <li key={rp.slug}>
                    <Link to={`/blog/${rp.slug}`}>{rp.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="compare-links" style={{ marginTop: "1.5rem" }}>
            <h3>Explore more</h3>
            <ul>
              <li><Link to="/blog">← All blog posts</Link></li>
              <li><Link to="/is-this-chrome-extension-safe">Is this Chrome extension safe?</Link></li>
              <li><Link to="/chrome-extension-permissions">Chrome extension permissions explained</Link></li>
              <li><Link to="/compare">Compare extension scanners</Link></li>
              <li><Link to="/research/case-studies">Case studies</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;
