// ... existing code ...

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  // @ts-ignore
  return <Component {...pageProps} />;
}

// ... existing code ...
