import { useEffect, useState } from "preact/hooks";

import { translate as t } from "../../translations/Translation.mjs";
import { PrimaryButton } from "../buttons/Button";

interface Settings {
  realtime: boolean;
  showReplies: boolean;
  display: string;
  sortBy: string;
  sortDirection: string;
  timespan: string;
}

const FeedSettings = ({ settings, onChange }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateUrlParams = () => {
    const url = new URL(window.location.href);
    if (localSettings.display === "grid") {
      url.searchParams.set("display", "grid");
    } else {
      url.searchParams.delete("display");
    }
    if (localSettings.showReplies === false) {
      url.searchParams.set("showReplies", "0");
    } else {
      url.searchParams.delete("showReplies");
    }
    if (localSettings.realtime) {
      url.searchParams.set("realtime", "1");
    } else {
      url.searchParams.delete("realtime");
    }

    window.history.replaceState({}, document.title, url.toString());
  };

  const saveSettings = () => {
    onChange(localSettings);
    updateUrlParams();
  };

  const inputs = [
    {
      type: "checkbox",
      id: "display_realtime",
      checked: localSettings.realtime,
      label: t("realtime"),
      onChange: () =>
        setLocalSettings({
          ...localSettings,
          realtime: !localSettings.realtime,
        }),
    },
    {
      type: "checkbox",
      id: "show_replies",
      checked: localSettings.showReplies,
      name: "show_replies",
      label: t("show_replies"),
      onChange: () =>
        setLocalSettings({
          ...localSettings,
          showReplies: !localSettings.showReplies,
        }),
    },
  ];

  const radioGroups = [
    {
      label: t("display"),
      name: "display",
      inputs: [
        { value: "posts", id: "display_posts", label: t("posts") },
        { value: "grid", id: "display_grid", label: t("grid") },
      ],
      checked: localSettings.display,
      onChange: (e) =>
        setLocalSettings({ ...localSettings, display: e.target.value }),
    },
    {
      label: t("sort_by"),
      name: "sortBy",
      inputs: [
        { value: "created_at", id: "sortByTime", label: t("time") },
        { value: "likes", id: "sortByLikes", label: t("likes") },
        { value: "zaps", id: "sortByZaps", label: t("zaps") },
      ],
      checked: localSettings.sortBy,
      onChange: (e) =>
        setLocalSettings({ ...localSettings, sortBy: e.target.value }),
    },
    {
      label: t("sort_direction"),
      name: "ordering",
      inputs: [
        { value: "desc", id: "ordering_desc", label: "▼" },
        { value: "asc", id: "ordering_asc", label: "▲" },
      ],
      checked: localSettings.sortDirection,
      onChange: (e) =>
        setLocalSettings({ ...localSettings, sortDirection: e.target.value }),
    },
    {
      label: t("timespan"),
      name: "timespan",
      inputs: [
        { value: "all", id: "timespanAll", label: t("All time") },
        { value: "day", id: "timespanDay", label: t("day") },
        { value: "week", id: "timespanWeek", label: t("week") },
        { value: "month", id: "timespanMonth", label: t("month") },
        { value: "year", id: "timespanYear", label: t("year") },
      ],
      checked: localSettings.timespan,
      onChange: (e) =>
        setLocalSettings({ ...localSettings, timespan: e.target.value }),
    },
  ];

  return (
    <div className="msg">
      <div className="msg-content">
        <div style="display:flex;flex-direction:column">
          <div>
            {inputs.map((input, i) => (
              <span key={i}>
                <input {...input} />
                <label htmlFor={input.id}>{input.label}</label>
              </span>
            ))}
          </div>
          {radioGroups.map((group, i) => (
            <div key={i} style={{ flexDirection: "column" }}>
              <p>{group.label}:</p>
              <p>
                {group.inputs.map((input, j) => (
                  <span key={j}>
                    <input
                      type="radio"
                      name={group.name}
                      id={input.id}
                      value={input.value}
                      checked={group.checked === input.value}
                      onChange={group.onChange}
                    />
                    <label htmlFor={input.id}>{input.label}</label>
                  </span>
                ))}
              </p>
            </div>
          ))}
          <p>
            <PrimaryButton onClick={saveSettings}>{t("save")}</PrimaryButton>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedSettings;
