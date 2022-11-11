import styled from 'styled-components';

export default styled.button`
  background: var(--button-bg);
  color: var(--button-color);
  border: var(--button-border);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover,
  &:focus,
  &:active {
    background: var(--button-bg-hover);
    color: var(--button-color-hover);
  }
`;
