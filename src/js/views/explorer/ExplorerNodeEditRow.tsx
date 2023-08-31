import { useState } from 'react';

import Node, { DIR_VALUE } from '@/state/Node.ts';

type EditRowProps = {
  level: number;
  parent: Node;
};

export const ExplorerNodeEditRow = ({ level, parent }: EditRowProps) => {
  const [showDirForm, setShowDirForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState(false);
  const [dirName, setDirName] = useState('');
  const [key, setKey] = useState('');
  const [val, setVal] = useState('');

  const toggleDirForm = () => {
    setShowDirForm(!showDirForm);
    setShowValueForm(false);
  };

  const toggleValueForm = () => {
    setShowValueForm(!showValueForm);
    setShowDirForm(false);
  };

  const handleDirSubmit = (e) => {
    e.preventDefault();
    parent.get(dirName).put(DIR_VALUE);
    setDirName('');
    setShowDirForm(false);
  };

  const handleValueSubmit = (e) => {
    e.preventDefault();
    parent.get(key).put(val);
    setKey('');
    setVal('');
    setShowValueForm(false);
  };

  return (
    <div style={{ paddingLeft: `${(level + 1) * 15}px` }}>
      <div className="flex flex-row items-center gap-4">
        <a className={`link text-sm ${showDirForm ? 'underline' : ''}`} onClick={toggleDirForm}>
          New Directory
        </a>
        <a className={`link text-sm ${showValueForm ? 'underline' : ''}`} onClick={toggleValueForm}>
          New Value
        </a>
      </div>

      {showDirForm && (
        <form onSubmit={handleDirSubmit} className="py-2 flex gap-2">
          <input
            className="input input-sm"
            type="text"
            placeholder="Directory Name"
            value={dirName}
            onChange={(e: any) => setDirName(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary">
            Create
          </button>
          <button className="btn btn-sm btn-neutral" onClick={() => setShowDirForm(false)}>
            Cancel
          </button>
        </form>
      )}

      {showValueForm && (
        <form onSubmit={handleValueSubmit} className="py-2 flex gap-2">
          <input
            className="input input-sm"
            type="text"
            placeholder="Key"
            value={key}
            onChange={(e: any) => setKey(e.target.value)}
          />
          <input
            className="input input-sm"
            type="text"
            placeholder="Value"
            value={val}
            onChange={(e: any) => setVal(e.target.value)}
          />
          <button className="btn btn-sm btn-primary" type="submit">
            Create
          </button>
          <button className="btn btn-sm btn-neutral" onClick={() => setShowValueForm(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
