import { FilterOption } from '@/components/feed/types';

type FilterOptionsProps = {
  filterOptions: FilterOption[];
  activeOption: FilterOption;
  onOptionClick: (option: number) => void;
};

const FilterOptionsSelector: React.FC<FilterOptionsProps> = ({
  filterOptions,
  activeOption,
  onOptionClick,
}) => {
  return (
    <div className="flex mb-4 gap-2 mx-2 md:mx-4">
      {filterOptions.map((opt, index) => (
        <button
          key={opt.name}
          className={`btn btn-sm ${activeOption.name === opt.name ? 'btn-primary' : 'btn-neutral'}`}
          onClick={() => onOptionClick(index)}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
};

export default FilterOptionsSelector;
