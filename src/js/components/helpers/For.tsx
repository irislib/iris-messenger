const For = ({ each, children }) => {
  return each.map((item, index) => {
    return children(item, index);
  });
};

export default For;
