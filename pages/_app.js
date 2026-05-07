import "../styles/global.css"
import { UserProvider } from "../hooks/useUser"
import { ThemeProvider } from "../hooks/useTheme"
import Head from "next/head"
import localFont from "next/font/local"

const gedbar = localFont({
  src: "../public/fonts/gedbar-regular.otf",
  variable: "--font-gedbar",
})

const eastman = localFont({
  src: "../public/fonts/EastmanAlternateVariable.ttf",
  variable: "--font-eastman",
})

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={`${gedbar.variable} ${eastman.variable}`}>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </UserProvider>
  )
}
