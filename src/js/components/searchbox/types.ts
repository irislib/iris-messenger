export type Props = {
  onSelect?: (result: Pick<ResultItem, 'key'>) => void;
  query?: string;
  focus?: boolean;
  resultsOnly?: boolean;
  class?: string;
  tabIndex?: number;
};

export type Result = {
  item: ResultItem;
};

export type ResultItem = {
  key: string;
  followers: Map<string, unknown>;
  followDistance: number;
  name?: string;
  picture?: string;
  uuid?: string;
};

export type State = {
  results: Array<Result>;
  query: string;
  offsetLeft: number;
  selected: number;
};
