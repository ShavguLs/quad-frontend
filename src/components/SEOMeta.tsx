import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Quaduni';
const DEFAULT_OG_IMAGE = '/og-default.png';

interface SEOMetaProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'book';
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

export const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  jsonLd,
  noindex = false,
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
