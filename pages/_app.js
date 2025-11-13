import "../styles/global.css"
import { UserProvider } from "../hooks/useUser"

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  )
}
