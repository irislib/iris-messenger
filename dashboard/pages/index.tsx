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

      <main className="flex w-full flex-1 flex-col items-center justify-center px-5 md:px-20 text-center">
        <h1 className="text-6xl font-bold">
          Iris Dashboard
        </h1>

        <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-xl border p-6 text-left"
          >
            <Github />
          </div>
          <div
            className="rounded-xl border text-left bg-white"
          >
            <Npm />
          </div>
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a href="https://twitter.com/iris_dot_to?ref_src=twsrc%5Etfw" className="twitter-follow-button"
           data-show-count="true">Follow @iris_dot_to</a>
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
      </footer>
    </div>
  )
}

export default Home
