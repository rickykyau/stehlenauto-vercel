import Script from "next/script";

const GA4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";
const KLAVIYO = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID ?? "";
const CLARITY = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";

export function AnalyticsScripts() {
  return (
    <>
      {GA4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA4}', {
                send_page_view: false,
                linker: { domains: ['stehlenauto.com', 'checkout.shopify.com', 'http-stehlenauto-com.myshopify.com'] }
              });
            `}
          </Script>
        </>
      )}

      {KLAVIYO && (
        <Script
          src={`https://static.klaviyo.com/onsite/js/${KLAVIYO}/klaviyo.js`}
          strategy="afterInteractive"
        />
      )}

      {CLARITY && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY}");
          `}
        </Script>
      )}
    </>
  );
}
