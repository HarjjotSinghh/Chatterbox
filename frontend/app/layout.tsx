import type { Metadata } from 'next';
import { Gravitas_One } from 'next/font/google';
import './globals.css';

const gravitas = Gravitas_One({ subsets: ['latin'], weight: ['400'], display: 'swap' });

export const metadata: Metadata = {
    title: { absolute: 'ChatterBox', template: '%s | ChatterBox', default: 'ChatterBox' },
    description: `Chatterbox is a web application that helps people improve their communication skills.\n The main motive of this web application will be to help people get better at communicating with people and increase their fluency and accuracy at speaking. The application will be designed to provide a platform for people to practice their communication skills and receive feedback from their peers.`,
    openGraph: {
        title: 'ChatterBox',
        description: 'Chatterbox is a web application that helps people improve their communication skills.',
        url: 'https://chatterbox.vercel.app',
        images: [
            {
                url: 'https://chatterbox.vercel.app/chatterbox.png',
                width: 1200,
                height: 630,
                alt: 'ChatterBox',
            },
        ],
    }
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={gravitas.className}>{children}</body>
        </html>
    );
}

