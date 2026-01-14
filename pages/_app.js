import "../styles/global.css"
import { UserProvider } from "../hooks/useUser"
import { ThemeProvider } from "../hooks/useTheme"

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </UserProvider>
  )
}
