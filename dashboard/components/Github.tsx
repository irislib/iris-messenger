import React, { useState, useEffect } from 'react';

type RepoResponse = {
  stargazers_count: number;
}

export default function Github() {
  const [data, setData] = useState<RepoResponse>({ stargazers_count: 0 });
  const [contributors, setContributors] = useState<any[]>([])

  useEffect(() => {
    fetch('https://api.github.com/repos/irislib/iris-messenger')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
      })
  }, [])

  useEffect(() => {
    fetch('https://api.github.com/repos/irislib/iris-messenger/contributors')
      .then((res) => res.json())
      .then((data) => {
        setContributors(data)
      })
  }, [])

  return (
    <>
      <a href="https://github.com/irislib/iris-messenger">Github</a>
      <p>Stars: {data && data.stargazers_count}</p>
      <p>Contributors: {contributors && contributors.length}</p>
    </>
  )
}