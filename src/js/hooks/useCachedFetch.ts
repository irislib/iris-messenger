import { useEffect, useState } from 'preact/hooks';

const useCachedFetch = (url, storageKey, dataProcessor = (data) => data) => {
  const cachedData = localStorage.getItem(storageKey);
  const initialData = cachedData ? JSON.parse(cachedData).data : [];

  const [data, setData] = useState(initialData);

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
          if (cachedData) {
            const { data } = JSON.parse(cachedData);
            setData(data);
          }
        });
    };

    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
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
