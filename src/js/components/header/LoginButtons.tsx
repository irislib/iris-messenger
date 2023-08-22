import localState from '@/state/LocalState.ts';
import { translate as t } from '@/translations/Translation.mjs';

export default function LoginButtons() {
  return (
    <div className="flex gap-2">
      <button
        className="btn btn-sm btn-primary"
        onClick={() => localState.get('showLoginModal').put(true)}
      >
        {t('log_in')}
      </button>
      <button
        className="btn btn-sm btn-neutral"
        onClick={() => localState.get('showLoginModal').put(true)}
      >
        {t('sign_up')}
      </button>
    </div>
  );
}
