# Supabase Database Setup

## Stap 1: Run SQL Migration

1. Ga naar je Supabase dashboard: https://heeinbtgcgobkonojypj.supabase.co
2. Klik op "SQL Editor" in het linker menu
3. Klik op "New Query"
4. Kopieer de volledige inhoud van het bestand `supabase-migration.sql` 
5. Plak het in de SQL Editor
6. Klik op "Run" om de migration uit te voeren

Dit zal de volgende tabellen aanmaken:
- `users` - Voor gebruikersaccounts en wachtwoorden
- `library` - Voor bibliotheek categorieën en media
- `assignments` - Voor huiswerk opdrachten
- `trainings` - Voor trainingen/repetities
- `practice_schedule` - Voor het repetitie schema
- `announcements` - Voor nieuws berichten
- `appointments` - Voor agenda afspraken
- `notification_settings` - Voor melding instellingen

## Stap 2: Test de Connectie

Start de app op met `bun start` en log in met:
- Gebruikersnaam: `admin`
- Wachtwoord: `admin`

De app zal automatisch:
- De admin gebruiker aanmaken als deze nog niet bestaat
- Default data laden voor trainingen en afspraken
- Alle wijzigingen opslaan naar Supabase

## Wat is geïntegreerd

✅ **Account gegevens** - Users worden opgeslagen in Supabase
✅ **Leden** - Members worden opgeslagen met hun wachtwoorden
✅ **Repetitie** - Practice schedule en trainingen worden opgeslagen
✅ **Huiswerk** - Assignments worden opgeslagen
✅ **Nieuws** - Announcements worden opgeslagen
✅ **Meldingen** - Notification settings worden opgeslagen
✅ **Afspraken** - Calendar appointments worden opgeslagen
✅ **Instellingen** - App settings worden opgeslagen

## Belangrijke Opmerkingen

- **Geen authenticatie**: De Supabase setup gebruikt alleen data opslag, geen Supabase Auth
- **Automatisch sync**: Alle wijzigingen in de app worden automatisch gesynchroniseerd met Supabase
- **Lokale state**: De app gebruikt React state voor snelle UI updates en Supabase als backend
- **Default data**: Bij eerste gebruik worden automatisch default records aangemaakt

## Database Configuratie

De database connectie is geconfigureerd in `lib/supabase.ts`:
- Project URL: `https://heeinbtgcgobkonojypj.supabase.co`
- Anon Key: Geconfigureerd in de code

## Troubleshooting

Als je errors ziet:
1. Controleer of de SQL migration succesvol is uitgevoerd
2. Kijk in de browser console voor foutmeldingen
3. Controleer de Supabase dashboard voor database errors
4. Zorg dat alle policies correct zijn ingesteld (zie migration.sql)
