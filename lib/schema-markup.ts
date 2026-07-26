/**
 * Auto-Generated Schema Markup (JSON-LD)
 * Structures search engine data for LocalBusiness, Article, Organization, and Event types.
 */

export interface SchemaLocalBusiness {
  name: string
  url: string
  telephone?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
  }
}

export function generateLocalBusinessSchema(biz: SchemaLocalBusiness): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": biz.name,
    "url": biz.url,
    "telephone": biz.telephone,
    "address": biz.address ? {
      "@type": "PostalAddress",
      ...biz.address
    } : undefined
  }

  return JSON.stringify(jsonLd, null, 2)
}

export function generateArticleSchema(article: {
  title: string
  description: string
  url: string
  author: string
  datePublished: string
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "mainEntityOfPage": article.url,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "datePublished": article.datePublished
  }

  return JSON.stringify(jsonLd, null, 2)
}
