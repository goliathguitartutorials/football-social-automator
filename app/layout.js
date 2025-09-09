import './globals.css';
import styles from './layout.module.css'; // We'll create this new CSS file

export const metadata = {
  title: "Football Social Automator",
  description: "A tool to generate social media posts for your club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.appContainer}>
          {/* The children prop will be our main page content */}
          {children}
        </div>
      </body>
    </html>
  );
}
