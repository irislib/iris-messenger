import { translate as t } from '../../translations/Translation.mjs';

function ShowMore({ onClick }) {
  return (
    <button className="btn btn-neutral btn-sm my-4" onClick={onClick}>
      {t('show_more')}
    </button>
  );
}

export default ShowMore;
