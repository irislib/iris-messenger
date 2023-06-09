import { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

type Props = {
  children: JSX.Element | JSX.Element[];
};

const Dropdown = ({ children }: Props) => {
  const [open, setOpen] = useState(false);

  const toggle = (e: MouseEvent, newOpenState: boolean) => {
    if (
      e.type === "click" &&
      e.target !== null &&
      !(e.target as HTMLElement).classList.contains("dropbtn")
    ) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setOpen(newOpenState);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        e.target &&
        !(e.target as HTMLElement).classList.contains("dropbtn")
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      class="dropdown"
      onClick={(e) => toggle(e, !open)}
      onMouseEnter={(e) => toggle(e, true)}
      onMouseLeave={(e) => toggle(e, false)}
    >
      <div class="dropbtn">…</div>
      {open ? <div class="dropdown-content">{children}</div> : ""}
    </div>
  );
};

export default Dropdown;
