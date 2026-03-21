import { Helmet } from 'react-helmet-async';
import {
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  isDefaultOgImage,
  resolveOgImage,
  SITE_NAME,
  SITE_THEME_COLOR,
  toAbsoluteUrl,
} from '../lib/seo';

type JsonLdBlock = Record<string, unknown>;

interface SEOMetaProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  ogImageAlt?: string;
  type?: 'website' | 'article' | 'book';
  jsonLd?: JsonLdBlock | JsonLdBlock[];
  noindex?: boolean;
  robots?: string;
  themeColor?: string;
  twitterSite?: string;
  author?: string;
}

export const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description,
  canonical,
  image,
  ogImageAlt,
  type = 'website',
  jsonLd,
  noindex = false,
  robots,
  themeColor = SITE_THEME_COLOR,
  twitterSite,
  author = SITE_NAME,
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? toAbsoluteUrl(canonical) : undefined;
  const ogImage = resolveOgImage(image);
  const shouldIncludeOgDimensions = isDefaultOgImage(image);
  const robotsContent = robots ?? (noindex ? 'noindex,nofollow' : undefined);
  const jsonLdBlocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
      {robotsContent && <meta name="robots" content={robotsContent} />}
      {themeColor && <meta name="theme-color" content={themeColor} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Mobile-specific meta tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      {shouldIncludeOgDimensions && <meta property="og:image:width" content={DEFAULT_OG_IMAGE_WIDTH.toString()} />}
      {shouldIncludeOgDimensions && <meta property="og:image:height" content={DEFAULT_OG_IMAGE_HEIGHT.toString()} />}
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}

      {jsonLdBlocks.map((block, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};
