const Show = (props) => {
  return props.when ? props.children : null;
};

export default Show;
