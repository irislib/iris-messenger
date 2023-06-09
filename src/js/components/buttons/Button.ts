import styled from 'styled-components';

const Button = styled.button`
  background: var(--button-bg);
  color: var(--button-color);
  border: var(--button-border);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
  width: ${(props) => props.width || 'auto'};

  ${(props) =>
    props.small &&
    `
    padding: 5px 20px;
  `}

  &:hover,
  &:focus,
  &:active {
    background: var(--button-bg-hover);
    color: var(--button-color-hover);
  }
`;

const PrimaryButton = styled(Button)`
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  border: var(--button-primary-border);

  &:hover,
  &:focus,
  &:active {
    background: var(--button-primary-bg-hover);
    color: var(--button-primary-color-hover);
  }
`;

export { Button, PrimaryButton };
