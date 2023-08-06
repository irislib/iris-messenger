import { translate as t } from '../translations/Translation.mjs';

export default function RelativeTime({ date }: { date: Date }) {
  const currentTime = new Date();
  const timeDifference = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
  const secondsInAMinute = 60;
  const secondsInAnHour = 60 * secondsInAMinute;
  const secondsInADay = 24 * secondsInAnHour;

  let str = '';
  if (timeDifference < secondsInAMinute) {
    str = t('now');
  } else if (timeDifference < secondsInAnHour) {
    str = Math.floor(timeDifference / secondsInAMinute) + 'm';
  } else if (timeDifference < secondsInADay) {
    str = Math.floor(timeDifference / secondsInAnHour) + 'h';
  } else {
    if (date.getFullYear() === currentTime.getFullYear()) {
      str = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } else {
      str = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }
  return <>{str}</>;
}
