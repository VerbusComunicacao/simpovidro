import Head from "next/head"
import Image from "next/image"

export default function Breve() {
  return (
    <div>
      <Head>
        <title>17º Simpovidro | O Encontro do Setor Vidreiro</title>
        <meta
          name="description"
          content="Infinitas possibilidades. De 5 a 8 de novembro."
        />

        {/* Indexing */}
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Social Sharing (WhatsApp, LinkedIn, Facebook, Slack) */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="17º Simpovidro | O Encontro do Setor Vidreiro"
        />
        <meta
          property="og:description"
          content="Onde o mercado vidreiro se encontra para redefinir o amanhã. De 5 a 8 de novembro."
        />
        <meta property="og:image" content="/images/logo-17-simpovidro.webp" />
        <meta property="og:image:alt" content="Logo do 17º Simpovidro" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="17º Simpovidro | O Encontro do Setor Vidreiro"
        />
        <meta
          name="twitter:description"
          content="Onde o mercado vidreiro se encontra para redefinir o amanhã. De 5 a 8 de novembro."
        />
        <meta name="twitter:image" content="/images/logo-17-simpovidro.webp" />

        {/* Premium Mobile Integration */}
        <meta name="theme-color" content="#014991" />
      </Head>

      <main className="relative overflow-hidden">
        <div className="relative flex flex-col items-center justify-center min-h-screen text-white bg-gradient-to-r from-logo-navy via-logo-purple to-logo-red py-12 md:py-0 px-4 md:px-0 overflow-hidden">
          {/* Background Icon */}
          <div className="absolute top-1/2 left-0 -translate-x-[45%] -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] md:w-[1000px] md:h-[1000px] pointer-events-none z-0 opacity-20 md:opacity-100">
            <Image
              src="/images/icone-simpovidro.svg"
              alt="Simpovidro Icon BG"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="relative z-10 w-full max-w-5xl ml-0 lg:ml-[30%] px-4">
            <div className="flex flex-col items-center justify-center">
              {/* Ícone branco de fundo (Marca d'água) */}
              <div className="mb-6 md:mb-5 w-28 sm:w-36 md:w-40 lg:w-44">
                <svg
                  viewBox="0 0 372.42 183.42"
                  className="w-full h-auto fill-white"
                >
                  <path d="M308.89,126.8c-7.68,6.12-17.61,9.85-28.18,9.85-7.27,0-14.39-1.75-21.56-5.31-.73-.36-1.45-.73-2.18-1.13-1.89-1.03-3.79-2.19-5.7-3.48-8.45-5.7-17.21-13.95-27.57-25.97l-4.5-5.22-4.29,5.39c-2.17,2.72-4.35,5.48-6.54,8.26l-.04.05c-5.1,6.46-10.37,13.15-15.74,19.6l-3.16,3.8,3.31,3.68c6.9,7.68,13.38,14.09,19.78,19.56.26.22.51.44.77.65.47.4.94.78,1.41,1.17,20.98,17.29,42.6,25.7,66.04,25.7,9.95,0,19.01-1.68,28.2-4.73l-.03-51.89Z" />
                  <path d="M280.71,0C256.74,0,234.68,8.79,213.25,26.87c-17,14.36-31.45,32.67-45.41,50.38-21.64,27.43-40.61,53.49-65.73,58.53v47.07c20.48-1.96,38.37-10.53,57.05-26.3,16.96-14.32,31.39-32.61,45.35-50.3l.04-.05c24.12-30.57,46.89-59.45,76.16-59.45,9.8,0,18.87,3.15,26.26,8.49V3.84C298.82,1.46,289.62,0,280.71,0Z" />
                  <path d="M311.91,177.97c12.48-4.52,23.93-11.77,33.61-21.45,16.39-16.39,25.82-37.02,26.8-59.98l-60.41,36.68v44.75Z" />
                  <path d="M372.41,92.4c0-.23,0-.46,0-.69,0-40.41-26.27-74.79-62.63-86.98v53.19c9.35,8.24,15.87,20.37,15.87,33.79s-4.89,24.82-13.81,33.03l.06,5.27,60.5-37.61Z" />
                  <path d="M179.72,47.08c-4.23-4.71-8.3-8.93-12.29-12.76-2.78-2.67-5.53-5.15-8.26-7.46C140.36,10.98,121.06,2.28,100.42.4c-.02,0-.04,0-.06,0-.69-.06-1.37-.12-2.06-.17-.27-.02-.54-.03-.82-.05-.44-.03-.87-.05-1.31-.07-1.48-.07-2.97-.1-4.46-.1-9.95,0-19.43,1.5-28.62,4.55v52.69c4.89-3.9,11.26-7.49,17.5-9.08h0c2.61-.66,5.31-1.1,8.08-1.29.14,0,.29-.02.43-.03.36-.02.72-.04,1.08-.05.29,0,.58-.01.87-.02.24,0,.49-.01.73-.01.08,0,.15,0,.23,0,7.17.05,14.19,1.79,21.27,5.3l.04-.03c3.43,1.74,7.12,4.03,11.1,7.03,7.08,5.33,15.11,12.89,24.33,23.58l4.5,5.22,4.3-5.39c2.16-2.71,4.33-5.46,6.5-8.22,5.11-6.48,10.39-13.17,15.82-19.7l3.16-3.8-3.3-3.68Z" />
                  <path d="M60.5,5.44c-12.48,4.52-23.93,11.77-33.61,21.45C10.5,43.28,1.07,63.88.09,86.85l60.41-36.68V5.44Z" />
                  <path d="M98.9,183.15v-46.9c-2.03.29-5.04.41-7.13.41-6.59,0-14.64-2.99-21.59-6.68-13.84-7.36-23.01-21.44-23.41-37.11,0-.38-.01-.77-.01-1.15,0-13.05,4.83-24.82,13.75-33.04l-.06-5.27S0,91.01,0,91.01H0c-.3,40.71,26.06,75.42,62.62,87.67,0,0,0-.02,0-.02,9.16,3.08,18.96,4.75,29.15,4.75,2.39,0,4.77-.09,7.13-.27Z" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-title uppercase font-black text-center">
                17º Simpovidro
              </h1>
              <p className="text-sm sm:text-base md:text-lg font-eastman font-light mt-2 text-center">
                Infinitas possibilidades
              </p>
            </div>
            <div className="flex text-3xl sm:text-4xl md:text-5xl mt-8 md:mt-10 font-title flex-col items-center text-center justify-center">
              De 5 a 8 <br />
              de novembro
            </div>
            <div className="flex text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-8 md:mt-10 font-title flex-col items-center text-center justify-center max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-none mx-auto">
              Vem aí o principal <br />
              encontro do setor vidreiro <br />
              da América Latina
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
