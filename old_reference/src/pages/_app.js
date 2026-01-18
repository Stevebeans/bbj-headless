import React from "react";
import App from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/app/layout";
import { fetchSpoilerBar } from "@/utils/fetchSpoilerPanel";
import "../app/styles/globals.css";

class MyApp extends App {
  static async getInitialProps(appContext) {
    const appProps = await App.getInitialProps(appContext);

    // Add error handling for fetching spoiler bar data
    let spoilerBar = [];
    try {
      spoilerBar = await fetchSpoilerBar();
    } catch (error) {
      console.error("Failed to fetch spoiler bar data:", error);
    }

    return { ...appProps, spoilerBar };
  }

  render() {
    const { Component, pageProps, spoilerBar } = this.props;

    const spoilerList = spoilerBar ? spoilerBar : [];

    return (
      <React.StrictMode>
        <AuthProvider>
          <Layout spoilerBar={spoilerList}>
            <Component {...pageProps} />
          </Layout>
        </AuthProvider>
      </React.StrictMode>
    );
  }
}

export default MyApp;
