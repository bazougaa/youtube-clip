import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
}

export function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    // Update the document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute = 'name') => {
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Update standard description
    updateMetaTag('description', description);
    
    // Update Open Graph tags for social/search display
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');

  }, [title, description]);

  return null;
}
