import type { Metadata } from "next";
import "./globals.css";
import ModalProvider from "@/components/ModalProvider";

export const metadata: Metadata = {
  title: "Perez Perícia | Sistema de Gestão de Processos Periciais",
  description: "Gerencie processos, controle prazos, organize vistorias e organize seus honorários de forma ágil com painel Kanban e dashboard integrado.",
  keywords: ["perícia judicial", "perito", "assistência técnica", "projuris", "gestão pericial", "kanban perito"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}

