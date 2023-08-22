import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, test } from 'vitest';

import SearchBox from '@/components/searchbox/SearchBox';

test('SearchBox component shows SearchPostsRow when a query is typed', async () => {
  const query = 'photography';

  render(<SearchBox />);

  // Simulate user events, e.g., typing in the search box
  const input = screen.getByRole('textbox');
  fireEvent.input(input, { target: { value: query } });

  // Check that the "SearchPostsRow" is visible with the correct text
  const searchPostsLink = screen.getByText(query);
  expect(searchPostsLink).toBeTruthy();
});
