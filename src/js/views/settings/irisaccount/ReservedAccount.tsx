import AccountName from '@/views/settings/irisaccount/AccountName.tsx';

export default function ReservedAccount({ name, enableReserved, declineReserved }) {
  return (
    <div>
      <p className="text-iris-green">
        Username iris.to/<b>{name}</b> is reserved for you!
      </p>
      <AccountName name={name} link={false} />
      <p>
        <button className="btn btn-sm btn-primary" onClick={() => enableReserved()}>
          Yes please
        </button>
      </p>
      <p>
        <button className="btn btn-sm btn-neutral" onClick={() => declineReserved()}>
          No thanks
        </button>
      </p>
    </div>
  );
}
