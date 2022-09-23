import type { NextPage } from 'next'
import Head from 'next/head'
import Github from '../components/Github'
import Npm from '../components/Npm'

const Home: NextPage = () => {
  return (
    <div className="flex min-h-screen flex-col py-2">
      <Head>
        <title>Iris Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-6xl font-bold">
          Iris Dashboard
        </h1>

        <div className="mt-6 w-full grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border p-6 text-left"
          >
            <Github />
          </div>
          <div
            className="rounded-xl border p-6 text-left"
          >
            <Npm />
          </div>
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="https://github.com/irislib/iris-messenger"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </footer>
    </div>
  )
}

export default Home
