import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, localeCookieName, type Locale } from "./config";

const loaders = {
  uz: () => import("../../messages/uz.json"),
  ru: () => import("../../messages/ru.json"),
  en: () => import("../../messages/en.json"),
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(localeCookieName)?.value;
  const locale: Locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const messages = (await loaders[locale]()).default;

  return {
    locale,
    messages,
  };
});
