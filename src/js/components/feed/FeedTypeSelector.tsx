import styled from "styled-components";

import Icons from "../../Icons";
import localState from "../../LocalState";

const Tab = styled.a`
  /* Default styles for all 'a' elements inside '.tabs' */

  &.isProfile_left {
    border-radius: 0;
  }

  &.isProfile_right {
    border-radius: 0;
  }

  @media (min-width: 626px) {
    &.isProfile_left {
      border-radius: 8px 0 0 0;
    }

    &.isProfile_right {
      border-radius: 0 8px 0 0;
    }
  }
`;

export default function FeedTypeSelector({ setDisplay, display, index }) {
  const isProfile = ["posts", "postsAndReplies", "likes"].includes(index);
  return (
    <div className="tabs">
      <Tab
        onClick={() => {
          setDisplay("posts");
          localState.get("settings").get("feed").get("display").put("posts");
        }}
        className={`${display === "grid" ? "" : "active"} ${
          isProfile ? "isProfile_left" : ""
        }`}
      >
        {Icons.post}
      </Tab>
      <Tab
        onClick={() => {
          setDisplay("grid");
          localState.get("settings").get("feed").get("display").put("grid");
        }}
        className={`${display === "grid" ? "active" : ""} ${
          isProfile ? "isProfile_right" : ""
        }`}
      >
        {Icons.grid}
      </Tab>
    </div>
  );
}
