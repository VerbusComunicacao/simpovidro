function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000"
  }

  if (process.env.VERCEL_ENV === `preview`) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  return "https://simpovidro.com.br"
}

const webserver = {
  origin: getOrigin(),
}

export default webserver
