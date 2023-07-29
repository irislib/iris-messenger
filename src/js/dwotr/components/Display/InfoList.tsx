type InfoListProps = {
  data?: InfoItem[];
  title?: string;
};

interface InfoItem {
  name: string;
  value: string | number | Date | boolean | null | undefined | object | bigint;
}

const formatValue = (value: any): string => {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return value.toString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'object':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        return 'Array[' + value.length + ']';
      }
      return 'Object';
    case 'undefined':
      return 'undefined';
    case 'function':
      return 'function';
    case 'symbol':
      return value.toString();
    case 'bigint':
      return value.toString() + 'n';
    default:
      return 'Unknown type';
  }
};

const InfoList = ({ data, title }: InfoListProps) => {
  return (<div className="flex flex-col border-2 rounded-lg border-white p-4">
  <div className="px-4 py-2 text-left text-lg font-semibold">{title}</div>
  {data?.map((item) => (
    <div className="flex justify-between p-2">
      <span className="text-right">{item.name}</span>
      <span>{formatValue(item.value)}</span>
    </div>
  ))}
</div>);
};

export default InfoList;
