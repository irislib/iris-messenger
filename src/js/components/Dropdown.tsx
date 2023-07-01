import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

type Props = {
  children: JSX.Element | JSX.Element[];
};

const Dropdown = ({ children }: Props) => {
  const [open, setOpen] = useState(false);

  const toggle = (e: MouseEvent, newOpenState: boolean) => {
    if (
      e.type === 'click' &&
      e.target !== null &&
      !(e.target as HTMLElement).classList.contains('dropbtn')
    ) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setOpen(newOpenState);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target && !(e.target as HTMLElement).classList.contains('dropbtn')) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative"
      onClick={(e) => toggle(e, !open)}
      onMouseEnter={(e) => toggle(e, true)}
      onMouseLeave={(e) => toggle(e, false)}
    >
      <button className="dropbtn btn btn-circle text-neutral-500">…</button>
      {open ? (
        <div className="absolute z-10 p-2 flex flex-col gap-2 right-0 w-56 rounded-md shadow-lg bg-black border-neutral-500 border-2">
          {children}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default Dropdown;
