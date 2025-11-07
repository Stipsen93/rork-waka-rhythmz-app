# Supabase Setup Instructies

Deze app gebruikt Supabase voor authenticatie en database opslag.

## Stappen om de database op te zetten:

### 1. Ga naar je Supabase project
Open https://heeinbtgcgobkonojypj.supabase.co

### 2. Ga naar de SQL Editor
Navigeer naar: Database > SQL Editor

### 3. Voer het database schema uit
Kopieer de volledige inhoud van het bestand `supabase-schema.sql` en voer deze uit in de SQL Editor.

Dit zal de volgende tabellen aanmaken:
- `profiles` - Gebruikersprofielen
- `library_categories` - Bibliotheek categorieën
- `media_items` - Media items (video's, afbeeldingen)
- `media_comments` - Reacties op media
- `assignments` - Huiswerk/opdrachten  
- `assignment_members` - Opdracht toewijzingen aan leden
- `assignment_submissions` - Ingeleverde opdrachten
- `trainings` - Trainingen/repetities
- `cancelled_practices` - Geannuleerde trainingen
- `announcements` - Mededelingen/nieuws
- `appointments` - Agenda afspraken
- `appointment_members` - Afspraak deelnemers
- `notification_settings` - Notificatie instellingen per gebruiker

### 4. Creëer de admin gebruiker in Supabase Auth

Omdat Supabase Auth gescheiden is van de database, moet je de admin gebruiker handmatig aanmaken:

1. Ga naar Authentication > Users in je Supabase dashboard
2. Klik op "Add user" > "Create new user"
3. Vul in:
   - Email: `admin@wakarythmz.local`
   - Password: `admin`
   - Auto Confirm User: **Aan** (belangrijk!)
   - User UID: `00000000-0000-0000-0000-000000000001`
4. Klik op "Create user"

De profile entry voor deze gebruiker is al aangemaakt in de database via het SQL script.

### 5. Test de login

Start de app en log in met:
- Gebruikersnaam: `admin`
- Wachtwoord: `admin`

## Authenticatie

De app gebruikt een custom authenticatie systeem:
- Gebruikers loggen in met **gebruikersnaam** (niet email)
- Intern wordt de gebruikersnaam omgezet naar een email: `{username}@wakarythmz.local`
- Dit email adres wordt gebruikt voor Supabase Auth
- De gebruikersgegevens (username, role) worden opgeslagen in de `profiles` tabel

## Nieuwe gebruikers aanmaken

Wanneer een admin een nieuw lid aanmaakt:
1. Er wordt een random wachtwoord gegenereerd
2. Een Supabase Auth gebruiker wordt aangemaakt met email `{username}@wakarythmz.local`
3. Een profile wordt aangemaakt in de database
4. Het wachtwoord wordt getoond aan de admin
5. Bij eerste login kan het lid het wachtwoord wijzigen

## Row Level Security (RLS)

Alle tabellen hebben RLS ingeschakeld. De policies zorgen ervoor dat:
- Alleen geauthenticeerde gebruikers kunnen data zien
- Gebruikers kunnen alleen hun eigen gegevens updaten
- Admin rechten worden gecontroleerd via de `role` kolom in `profiles`

## Let op

- De admin user MOET de ID `00000000-0000-0000-0000-000000000001` hebben
- Email verificatie is uitgeschakeld (Auto Confirm User = aan)
- De app werkt alleen met gebruikersnamen, niet met emails
