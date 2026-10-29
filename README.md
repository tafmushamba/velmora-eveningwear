# Velmora

A responsive eveningwear storefront with a catalogue-grounded AI shopping adviser. All products and brand details are fictional. Images are AI-generated illustrations.

- [Live storefront](https://velmora-eveningwear.netlify.app/)
- [Black Friday page](https://velmora-eveningwear.netlify.app/black-friday.html)

## Run locally

Use Node.js 22.13 or later and npm.

```sh
npm ci
npm run dev -- --port 5180
```

Open http://127.0.0.1:5180/ . The separate seasonal page is `/black-friday.html`; a product example is `/product.html?id=VLM-048`.

## Enable the AI adviser

```sh
cp .env.example .env.local
```

Set `OPENAI_API_KEY` to your own OpenAI API key and `OPENAI_MODEL` to a Responses API model with structured-output support, then restart the local server. These settings stay on the server. Never use `VITE_` prefixes or commit real credentials. API calls use your account's allowance.

The app runs without credentials; the adviser reports that it is unavailable until configured. It does not simulate AI replies.

## Check and build

```sh
npm test
npm run build
npm run preview -- --port 5180
```

The build checks the catalogue's primary and colour images before compiling. Tests cover catalogue selection, delivery, regional presentation, adviser validation and navigation behaviour.

## Structure

- `src/`: storefront, catalogue filters, product/bag UI and adviser dialog.
- `data/`: fictional product catalogue and shared store policies.
- `public/images/`: images required by the storefront.
- `server/` and `shared/`: OpenAI integration and typed request/output validation.
- `netlify/functions/adviser.ts`: hosted `/api/adviser` endpoint.
- `scripts/`: image manifest checks used by the build.
- `tests/`: automated behaviour checks.

The adviser uses OpenAI Responses with structured outputs, catalogue checks and a separate generated-reply review. Product cards read prices, fabrics, sizes and availability from the catalogue. Unknown measurements and delivery guarantees are not invented. Model interpretation and review remain probabilistic.

## Deploy to Netlify

Use the included `netlify.toml`: build command `npm run build`, publish directory `dist`, and functions directory `netlify/functions`. Configure `OPENAI_API_KEY` and `OPENAI_MODEL` in the project's server environment before deploying. Static-only hosting does not run the adviser endpoint.

## Scope

UK/EU delivery estimates, colour/size selection, occasion filters and a browser-session bag are included. Checkout is unavailable; there is no Shopify connection or order processing. Garment measurements and live production capacity are not supplied. Euro prices are indicative; adviser budgets remain in GBP.
