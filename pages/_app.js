import "../styles/global.css"
import { UserProvider } from "../hooks/useUser"
import { ThemeProvider } from "../hooks/useTheme"
import Head from "next/head"
import Script from "next/script"
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID

  return (
    <UserProvider>
      <ThemeProvider>
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Google Analytics 4 (GA4) */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity (Session Recording & Heatmaps) */}
        {clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${clarityId}");
            `}
          </Script>
        )}

        <div className={`${gedbar.variable} ${eastman.variable}`}>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </UserProvider>
  )
}
