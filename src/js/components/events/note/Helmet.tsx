import { Helmet } from 'react-helmet';

const NoteHelmet = ({ attachments, name, text }) => {
  const ogImageUrl = attachments?.find((a) => a.type === 'image')?.data;
  const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
  const quotedShortText = `"${shortText}"`;

  const title = `${name || 'User'} on Iris`;
  return (
    <Helmet titleTemplate="%s">
      <title>{`${title}: ${quotedShortText}`}</title>
      <meta name="description" content={quotedShortText} />
      <meta property="og:type" content="article" />
      {ogImageUrl ? <meta property="og:image" content={ogImageUrl} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={quotedShortText} />
    </Helmet>
  );
};

export default NoteHelmet;
