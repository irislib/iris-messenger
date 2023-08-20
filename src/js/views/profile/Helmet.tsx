import { Helmet } from 'react-helmet';

import Show from '../../components/helpers/Show.tsx';

export default function ProfileHelmet({ title, description, picture, ogTitle }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="profile" />
      <Show when={picture}>
        <meta property="og:image" content={picture} />
        <meta name="twitter:image" content={picture} />
      </Show>
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
}
