import './globals.css'

export const metadata = {
  title: 'Thumbnail Generator',
  description: 'AI YouTube thumbnail generator — Claude + FLUX',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
