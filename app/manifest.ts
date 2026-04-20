import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CipherTeams",
    short_name: "CipherTeams",
    description: "Secure team password manager foundation",
    start_url: "/",
    display: "standalone",
    background_color: "#090e18",
    theme_color: "#155eef",
    icons: [
      {
        src: "/icon",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
