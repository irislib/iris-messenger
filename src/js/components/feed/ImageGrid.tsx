import styled from 'styled-components';

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 4px;
  @media (max-width: 1023px) {
    grid-gap: 1px;
  }
`;

export default ImageGrid;
