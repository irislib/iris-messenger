import { JSX } from 'preact';

type Props = {
  children: JSX.Element | JSX.Element[];
};

const Dropdown = ({ children }: Props) => {
  return (
    <details class="dropdown dropdown-left">
      <summary className="btn btn-circle text-neutral-500 text-xl">…</summary>
      <div class="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52">{children}</div>
    </details>
  );
};

export default Dropdown;
