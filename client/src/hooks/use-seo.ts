import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  ogUrl?: string;
  keywords?: string;
  canonicalUrl?: string;
}

export function useSEO({
  title,
  description,
  ogImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=630&fit=crop",
  ogUrl,
  keywords,
  canonicalUrl,
}: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = `${title} | LuxeStore`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      meta.content = title;
      document.head.appendChild(meta);
    }

    // Update og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update og:image
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) {
      ogImg.setAttribute("content", ogImage);
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:image");
      meta.content = ogImage;
      document.head.appendChild(meta);
    }

    // Update og:url
    if (ogUrl) {
      const ogURL = document.querySelector('meta[property="og:url"]');
      if (ogURL) {
        ogURL.setAttribute("content", ogUrl);
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "og:url");
        meta.content = ogUrl;
        document.head.appendChild(meta);
      }
    }

    // Update keywords
    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", keywords);
      } else {
        const meta = document.createElement("meta");
        meta.name = "keywords";
        meta.content = keywords;
        document.head.appendChild(meta);
      }
    }

    // Update canonical
    if (canonicalUrl) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", canonicalUrl);
      } else {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = canonicalUrl;
        document.head.appendChild(link);
      }
    }
  }, [title, description, ogImage, ogUrl, keywords, canonicalUrl]);
}
