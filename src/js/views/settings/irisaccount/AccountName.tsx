import { route } from 'preact-router';

export default function AccountName({ name, link = true }) {
  return (
    <>
      <p>
        Username: <b>{name}</b>
      </p>
      <p>
        Short link:{' '}
        {link ? (
          <a
            href={`https://iris.to/${name}`}
            onClick={(e) => {
              e.preventDefault();
              route(`/${name}`);
            }}
          >
            iris.to/{name}
          </a>
        ) : (
          <>iris.to/{name}</>
        )}
      </p>
      <p>
        Nostr address (nip05): <b>{name}@iris.to</b>
      </p>
    </>
  );
}
