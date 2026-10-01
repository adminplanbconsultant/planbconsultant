# Destination ticker flags

The six unmodified SVG assets in `public/images/flags/` come from the consistent [hampusborgos/country-flags set](https://github.com/hampusborgos/country-flags), which documents Wikimedia Commons origins and public-domain flag artwork. Downloaded on 2 October 2026 from `https://raw.githubusercontent.com/hampusborgos/country-flags/main/svg/{code}.svg`.

| Country | Asset | Native width:height |
| --- | --- | --- |
| Canada | `ca.svg` | 2:1 |
| Australia | `au.svg` | 2:1 |
| Germany | `de.svg` | 5:3 |
| Sweden | `se.svg` | 8:5 |
| Portugal | `pt.svg` | 3:2 |
| United States | `us.svg` | 19:10 |

The ticker reserves each asset's aspect ratio with explicit dimensions. CSS renders it at 28px wide on desktop and 24px on mobile, with auto height, `object-fit: contain`, and 2px corners. Flags have empty alt text and are decorative beside the country name. The duplicate loop group remains hidden from assistive technology and its links remain outside the tab order.
