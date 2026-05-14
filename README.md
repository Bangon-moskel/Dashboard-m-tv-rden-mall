# Dashboard-mall

En self-hosted, dynamisk dashboard. Klona repot, kör `docker-compose up`, och
bygg din egen dashboard genom att lägga till widgets och visuellt koppla ihop
datapipelines i en n8n-likt nodredigerare — direkt i webbläsaren.

## Vad funkar idag (Fas 1)

- **Widgets**: KPI, linjediagram, stapeldiagram, tabell, status-badge
- **Pipeline-editor**: dra-och-koppla noder för HTTP-anrop, statisk JSON,
  JSONPath-filter, uttrycksberäkning, schemaläggning och output
- **Polling**: pipeline körs på inställt intervall medan tabben är öppen
- **CORS-proxy**: inbyggd Next.js-route som vidarebefordrar anrop med headers
  och auth — slipper CORS-strul
- **Persistens**: hela dashboard-konfigurationen sparas i din webbläsares
  IndexedDB. Export och import som JSON
- **Tema**: ljust och mörkt

## Vad som kommer (Fas 2)

- **Python-skript på schema** via en FastAPI-backend (`./api`)
- **APScheduler** för riktiga cron-jobs (körs även när tabben är stängd)
- **Time-series-databas** för historik så linjediagram visar trender
- **Webhook-triggers**

Grundens datalager ligger redan bakom ett `ConfigStore`-interface
(`src/lib/storage/ConfigStore.ts`) så fas 2 byter implementation utan att
röra UI-koden.

## Kom igång

### Docker (rekommenderat)

```bash
docker compose up --build
```

Öppna http://localhost:3000.

### Lokal utveckling

```bash
npm install
npm run dev
```

## Så bygger du en widget

1. Klicka **Redigera** i toppen, sedan **Lägg till widget**
2. Välj typ (t.ex. KPI)
3. Klicka kugghjulet på widgeten → öppnar pipeline-editorn
4. Default-pipelinen pollar `jsonplaceholder` var 60s. Justera:
   - **HTTP-noden**: peka mot ditt eget API
   - **JSONPath-noden**: plocka ut värdet du vill visa, t.ex. `$.data.total`
   - **Output-noden**: bind till `value`
5. Klicka **Kör nu** för en omedelbar test
6. Gå tillbaka — widgeten visar värdet

Pipelinen körs sedan på det intervall som Schemaläggning-noden anger så länge
någon har dashboarden öppen.

## Lägg till egen widget-typ (för utvecklare)

1. Skapa komponent i `src/components/widgets/`
2. Registrera den i `src/components/widgets/registry.tsx`
3. Lägg till en ny variant i `WidgetKind` (`src/lib/types/index.ts`) och en
   ikon i `AddWidgetMenu.tsx`

## Lägg till egen nodtyp

1. Lägg till variant i `NodeKindSchema` + `defaultConfigFor` i
   `src/lib/types/index.ts`
2. Lägg formulär i `NodeInspector.tsx`
3. Lägg körlogik i `src/lib/runtime/executor.ts`

## Projektstruktur

```
src/
  app/
    page.tsx                # Dashboard (view + edit)
    pipelines/[id]/page.tsx # Pipeline-editor (React Flow)
    api/proxy/route.ts      # CORS-proxy
  components/
    dashboard/              # Topbar, Grid, AddWidgetMenu
    widgets/                # Renderare per widget-typ
    pipeline/               # React Flow + NodeInspector
    ui/                     # Knappar, formulärfält
  lib/
    types/                  # All shared type
    storage/                # ConfigStore-interface + IndexedDB-impl
    runtime/                # Executor, scheduler, transforms
    store.ts                # Zustand-store
```
