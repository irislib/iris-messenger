import { translate as t } from '@/translations/Translation.mjs';

const preventUpDownDefault = (e) => {
  if (e.keyCode === 38 || e.keyCode === 40) {
    e.preventDefault();
  }
};

export default function SearchForm({ inputRef, onSubmit, query, setQuery, onKeyUp }) {
  const myOnInput = (e) => {
    const value = e.target.value;
    if (value.match(/nsec1[a-zA-Z0-9]{20,65}/gi)) {
      return;
    }
    setQuery(value);
  };

  return (
    <form onSubmit={(e) => onSubmit(e)}>
      <label>
        <input
          value={query}
          ref={inputRef}
          type="text"
          onKeyPress={preventUpDownDefault}
          onKeyDown={preventUpDownDefault}
          onKeyUp={onKeyUp}
          placeholder={t('search')}
          tabIndex={1}
          onInput={myOnInput} // handling input changes via onInput
          className="input-bordered border-neutral-500 input input-sm w-full"
        />
      </label>
    </form>
  );
}
