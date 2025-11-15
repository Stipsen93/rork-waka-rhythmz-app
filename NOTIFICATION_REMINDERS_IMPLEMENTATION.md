# Notificatie Reminders Implementatie

## Wat is er gewijzigd?

De notificatie-instellingen zijn uitgebreid met **twee aparte soorten meldingen** per categorie:

### 1. **Direct Meldingen** (Instant Notifications)
- Verstuurd zodra een item wordt toegevoegd
- Bijvoorbeeld: "Nieuw huiswerk toegevoegd"

### 2. **Herinnering Meldingen** (Reminder Notifications)  
- Verstuurd X uur voor de datum/tijd van het evenement
- Bijvoorbeeld: "Herinnering: Huiswerk deadline is over 24 uur"

## Stappen om te voltooien:

### Stap 1: SQL Migratie Uitvoeren
Voer het bestand `add-notification-reminders.sql` uit in Supabase SQL Editor.

Dit script:
- Voegt nieuwe kolommen toe aan `notification_settings` tabel:
  - `news_reminder_enabled` (boolean)
  - `assignments_reminder_enabled` (boolean)  
  - `assignments_hours_advance` (integer)
  - `trainings_reminder_enabled` (boolean)
  - `performances_reminder_enabled` (boolean)

- Maakt een nieuwe tabel `scheduled_reminders` aan voor het bijhouden van geplande herinneringen

### Stap 2: AppState Sync Functies Updaten

Je moet nu nog de sync functies in `providers/AppState.tsx` updaten op de volgende locaties:

#### A. In `syncAllData` functie (regel ~507-516):
```typescript
if (settingsRes.data) {
  setNotificationSettings({
    newsEnabled: settingsRes.data.news_enabled,
    newsReminderEnabled: settingsRes.data.news_reminder_enabled ?? true,
    newsHoursAdvance: settingsRes.data.news_hours_advance,
    assignmentsEnabled: settingsRes.data.assignments_enabled,
    assignmentsReminderEnabled: settingsRes.data.assignments_reminder_enabled ?? false,
    assignmentsHoursAdvance: settingsRes.data.assignments_hours_advance ?? 24,
    trainingCancellationEnabled: settingsRes.data.training_cancellation_enabled,
    trainingsReminderEnabled: settingsRes.data.trainings_reminder_enabled ?? true,
    trainingHoursAdvance: settingsRes.data.training_hours_advance,
    performancesEnabled: settingsRes.data.performances_enabled,
    performancesReminderEnabled: settingsRes.data.performances_reminder_enabled ?? true,
    performancesHoursAdvance: settingsRes.data.performances_hours_advance,
  });
}
```

#### B. In `initializeData` functie (regel ~777-786):
Zelfde code als hierboven

#### C. In `settingsSubscription` callback (regel ~980-988):
Zelfde code als hierboven

#### D. In `updateNotificationSettings` functie (regel ~1777-1790):
```typescript
const updateNotificationSettings = useCallback(async (settings: NotificationSettings) => {
  console.log('💾 Updating notification settings in Supabase...');
  setNotificationSettings(settings);
  const updateData: Database['public']['Tables']['notification_settings']['Update'] = {
    news_enabled: settings.newsEnabled,
    news_reminder_enabled: settings.newsReminderEnabled,
    news_hours_advance: settings.newsHoursAdvance,
    assignments_enabled: settings.assignmentsEnabled,
    assignments_reminder_enabled: settings.assignmentsReminderEnabled,
    assignments_hours_advance: settings.assignmentsHoursAdvance,
    training_cancellation_enabled: settings.trainingCancellationEnabled,
    trainings_reminder_enabled: settings.trainingsReminderEnabled,
    training_hours_advance: settings.trainingHoursAdvance,
    performances_enabled: settings.performancesEnabled,
    performances_reminder_enabled: settings.performancesReminderEnabled,
    performances_hours_advance: settings.performancesHoursAdvance,
  };
  await supabase.from('notification_settings').update(updateData).eq('id', (await supabase.from('notification_settings').select('id').single()).data?.id ?? '');
  console.log('✅ Notification settings updated');
}, []);
```

#### E. In `initializeData` else clause voor default settings (regel ~788-806):
```typescript
} else {
  const defaultSettings: Database['public']['Tables']['notification_settings']['Insert'] = {
    news_enabled: true,
    news_reminder_enabled: true,
    news_hours_advance: 24,
    assignments_enabled: true,
    assignments_reminder_enabled: false,
    assignments_hours_advance: 24,
    training_cancellation_enabled: true,
    trainings_reminder_enabled: true,
    training_hours_advance: 2,
    performances_enabled: true,
    performances_reminder_enabled: true,
    performances_hours_advance: 48,
  };
  await supabase.from('notification_settings').insert(defaultSettings);
  setNotificationSettings({
    newsEnabled: defaultSettings.news_enabled,
    newsReminderEnabled: defaultSettings.news_reminder_enabled,
    newsHoursAdvance: defaultSettings.news_hours_advance,
    assignmentsEnabled: defaultSettings.assignments_enabled,
    assignmentsReminderEnabled: defaultSettings.assignments_reminder_enabled,
    assignmentsHoursAdvance: defaultSettings.assignments_hours_advance,
    trainingCancellationEnabled: defaultSettings.training_cancellation_enabled,
    trainingsReminderEnabled: defaultSettings.trainings_reminder_enabled,
    trainingHoursAdvance: defaultSettings.training_hours_advance,
    performancesEnabled: defaultSettings.performances_enabled,
    performancesReminderEnabled: defaultSettings.performances_reminder_enabled,
    performancesHoursAdvance: defaultSettings.performances_hours_advance,
  });
}
```

### Stap 3: Backend Logica (Toekomstige stap)

Voor het daadwerkelijk verzenden van reminder meldingen moet je nog:
1. Een cron job of scheduled function maken die elke X minuten draait
2. Deze functie checkt de `scheduled_reminders` tabel voor reminders die verstuurd moeten worden
3. Vergelijk `scheduled_for` met de huidige tijd
4. Verstuur de melding en markeer `sent = true`

Dit zou je kunnen doen met:
- Supabase Edge Functions + Supabase Cron
- Een externe service zoals Vercel Cron Jobs
- Een backend worker process

### Voorbeeld logica voor reminders:

Wanneer een admin een nieuws item toevoegt met datum "2025-12-20":
1. Als `newsEnabled` = true → Verstuur direct melding "Nieuw nieuws toegevoegd"
2. Als `newsReminderEnabled` = true:
   - Bereken reminder tijd: "2025-12-20" - `newsHoursAdvance` uur (bijv. 24 uur)
   - Insert in `scheduled_reminders`:
     ```sql
     INSERT INTO scheduled_reminders (type, item_id, scheduled_for)
     VALUES ('news', 'nieuws_id', '2025-12-19 00:00:00')
     ```

Wanneer de cron job draait:
1. Query: `SELECT * FROM scheduled_reminders WHERE sent = false AND scheduled_for <= NOW()`
2. Voor elk resultaat:
   - Haal het originele item op (nieuws/huiswerk/etc)
   - Verstuur melding naar relevante gebruikers
   - Update: `UPDATE scheduled_reminders SET sent = true, sent_at = NOW() WHERE id = ...`

## Testing

1. Log in als admin
2. Ga naar Meldingen pagina
3. Open een categorie (bijv. Nieuws)
4. Je ziet nu 2 toggles:
   - "Melding ontvangen als er een nieuw bericht is toegevoegd"
   - "Herinnering sturen voor datum in nieuws"
5. Als je de herinnering toggle aan zet, verschijnt "Hoeveel uur van tevoren"
6. Test dat de instellingen correct worden opgeslagen in Supabase

## Database Types

Als je TypeScript errors krijgt, mogelijk moet je de database types regenereren:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

## Logica die nu NIET verzonden wordt (maar zou moeten)

De admin kan de creator zijn van items, dus de logica:
- Admin voegt nieuws toe → Geen melding voor de admin zelf (alleen voor leden)
- Lid voegt afspraak toe → Geen melding voor het lid zelf (alleen voor anderen in de afspraak)

Dit is al geïmplementeerd in de huidige code.
