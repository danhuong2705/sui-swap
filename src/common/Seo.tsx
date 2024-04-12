interface SeoProps {
  title: string;
  description: string;
  image: string;
  url: string;
  domain?: string;
}
const Seo: React.FC<SeoProps> = ({
  title,
  description,
  image,
  url,
  domain = '',
}) => {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Facebook Meta Tags */}
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content={domain} />
      <meta property="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
};

export default Seo;
