"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "next-themes";

import type { Locale } from "@/lib/i18n/config";

type ProvidersProps = {
  locale: Locale;
  messages: AbstractIntlMessages;
  timeZone: string;
  children: React.ReactNode;
};

export function Providers({ locale, messages, timeZone, children }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
