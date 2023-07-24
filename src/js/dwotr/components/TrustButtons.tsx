import styled from "styled-components";

export const ReactionButtons = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  text-align: right;
  font-size: 14px;
  color: var(--text-time);

  a {
    flex: 1;
  }

  .msg.quote &,
  .msg.standalone & {
    margin-bottom: 12px;
  }
`;

export const ReactionCount = styled.span`
  flex: 3;
  margin-left: 5px;
  cursor: pointer;
  min-width: 4em;
  text-align: left;
  user-select: none;
  white-space: nowrap;

  &:not(:last-of-type) {
    margin-right: 5px;
  }

  ${(props) => (props.active ? "color: var(--text-color)" : "")};
`;
