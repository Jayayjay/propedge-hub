export type PropFirm =
  | "ftuk"
  | "funderpro"
  | "novafunded"
  | "e8markets"
  | "myforexfunds"
  | "fxify"
  | "fundingpips"
  | "the5ers";

export const propFirmLogos: Record<
  PropFirm,
  { name: string; domain: string; logo: string; fallback: string }
> = {
  ftuk:         { name: "FTUK",           domain: "ftuk.com",         logo: "https://logo.clearbit.com/ftuk.com?size=128",         fallback: "https://www.google.com/s2/favicons?domain=ftuk.com&sz=128"         },
  funderpro:    { name: "FunderPro",      domain: "funderpro.com",    logo: "https://logo.clearbit.com/funderpro.com?size=128",    fallback: "https://www.google.com/s2/favicons?domain=funderpro.com&sz=128"    },
  novafunded:   { name: "Nova Funded",    domain: "novafunded.com",   logo: "https://logo.clearbit.com/novafunded.com?size=128",   fallback: "https://www.google.com/s2/favicons?domain=novafunded.com&sz=128"   },
  e8markets:    { name: "E8 Markets",     domain: "e8markets.com",    logo: "https://logo.clearbit.com/e8markets.com?size=128",    fallback: "https://www.google.com/s2/favicons?domain=e8markets.com&sz=128"    },
  myforexfunds: { name: "My Forex Funds", domain: "myforexfunds.com", logo: "https://logo.clearbit.com/myforexfunds.com?size=128", fallback: "https://www.google.com/s2/favicons?domain=myforexfunds.com&sz=128" },
  fxify:        { name: "FXIFY",          domain: "fxify.com",        logo: "https://logo.clearbit.com/fxify.com?size=128",        fallback: "https://www.google.com/s2/favicons?domain=fxify.com&sz=128"        },
  fundingpips:  { name: "Funding Pips",   domain: "fundingpips.com",  logo: "https://logo.clearbit.com/fundingpips.com?size=128",  fallback: "https://www.google.com/s2/favicons?domain=fundingpips.com&sz=128"  },
  the5ers:      { name: "The5ers",        domain: "the5ers.com",      logo: "https://logo.clearbit.com/the5ers.com?size=128",      fallback: "https://www.google.com/s2/favicons?domain=the5ers.com&sz=128"      },
};
