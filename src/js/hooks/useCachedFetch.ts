import { useEffect, useMemo, useState } from 'preact/hooks';

const useCachedFetch = (url, storageKey, dataProcessor = (data) => data) => {
  const cachedData = useMemo(() => {
    const cached = localStorage.getItem(storageKey);
    return cached ? JSON.parse(cached) : null;
  }, [storageKey]);

  const initialData = cachedData ? cachedData.data : [];

  const [data, setData] = useState(initialData);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      fetch(url)
        .then((res) => res.json())
        .then((fetchedData) => {
          const processedData = dataProcessor(fetchedData);
          setData(processedData);
          localStorage.setItem(
            storageKey,
            JSON.stringify({ data: processedData, timestamp: new Date().getTime() }),
          );
        })
        .catch(() => {
          if (!hasError) {
            if (cachedData) {
              setData(cachedData);
            }
            setHasError(true);
          }
        });
    };

    if (cachedData) {
      const { timestamp } = cachedData;
      const age = (new Date().getTime() - timestamp) / 1000 / 60;

      if (age >= 15) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [url, storageKey, dataProcessor]);

  return data;
};

export default useCachedFetch;
