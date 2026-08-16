# orders

Microfrontend remote (Vite + Module Federation) con la lista ordini del backoffice,
in stile pixel art. Lo shell lo importa come `orders/Orders`.

```bash
pnpm install
pnpm dev     # standalone, dati demo
pnpm build   # genera dist/ con remoteEntry.js
```

## Props di `Orders`

| Prop           | Default       | Descrizione                                            |
| -------------- | ------------- | ------------------------------------------------------ |
| `orders`       | `FAKE_ORDERS` | Sostituisce il dataset demo.                            |
| `placedOrders` | `[]`          | Ordini appena creati dal checkout, accodati in cima.    |

Senza prop il remote mostra i dati demo, così resta montabile anche da solo.
Nessun dato reale: il dataset in `src/components/ordersData.js` è inventato.

## Stile

Tutto il CSS è prefissato `.mfe-orders` e vive in `src/components/Orders.css`,
così il remote non sporca lo host. Il font pixel (Press Start 2P) è dichiarato
lì con `@font-face`: nessun `<link>` da iniettare, e se il fetch fallisce si
ricade sul monospace di sistema.

## Rilascio

Il push di un tag fa partire `.github/workflows/build-and-deploy.yml`, che
pubblica `dist/` su MFE Orchestrator usando il nome del tag come versione.
