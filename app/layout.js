import './globals.css';
import styles from './layout.module.css';
import AppWrapper from './AppWrapper'; // MODIFIED: Import the wrapper

export const metadata = {
  title: "Football Social Automator",
  description: "A tool to generate social media posts for your club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* MODIFIED: Wrap everything in the AppWrapper */}
        <AppWrapper>
          <div className={styles.appContainer}>
            {children}
          </div>
        </AppWrapper>
      </body>
    </html>
  );
}
