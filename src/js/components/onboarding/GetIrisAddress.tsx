import { route } from 'preact-router';

export default function GetIrisAddress({ existingIrisToAddress, setShowNoIrisToAddress }) {
  if (!existingIrisToAddress) {
    return (
      <div className="flex flex-col gap-2 mb-2">
        <p>Get your own iris.to/username?</p>
        <p className="flex gap-2">
          <button className="btn btn-primary" onClick={() => route('/settings/iris_account')}>
            Yes please
          </button>
          <button className="btn btn-neutral" onClick={() => setShowNoIrisToAddress(false)}>
            No thanks
          </button>
        </p>
      </div>
    );
  }
  return null;
}
