# Push Notifications Integratie - Instructies

## 🎯 Implementatie Complete

Een volledige push notification integratie is geïmplementeerd met:

### ✅ Wat is Geïmplementeerd:

1. **Database Schema** (`add-push-notifications-schema.sql`)
   - `push_tokens` tabel voor token opslag
   - `notification_logs` tabel voor debugging
   - Run dit SQL script in Supabase SQL Editor

2. **Notification Provider** (`providers/NotificationProvider.tsx`)
   - Automatische token registratie bij login
   - Werkt op iOS en Android (niet op web)
   - Gekoppeld aan app lifecycle

3. **Backend tRPC Routes**
   - `notifications.registerToken` - Token opslaan
   - `notifications.unregisterToken` - Token verwijderen
   - `notifications.sendNotification` - Notifications versturen
   - `notifications.getUserTokens` - Tokens ophalen

4. **Notification Service** (`lib/notification-service.ts`)
   - Helper functies voor verschillende notification types
   - Respect voor user preferences

5. **Meldingen Pagina**
   - Status indicator toont of push notifications actief zijn
   - Gekoppeld aan gebruikersvoorkeuren

## 📱 Automatische Notifications Bij Nieuwe Content

Om automatische notifications te versturen wanneer nieuwe content wordt toegevoegd, voeg de notification service calls toe aan de bestaande functies:

### Nieuwe Aankondiging (Announcement)

In `providers/AppState.tsx`, update de `addAnnouncement` functie:

```typescript
import { notifyNewAnnouncement } from '@/lib/notification-service';

const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
  console.log('💾 Adding announcement to Supabase...');
  const newAnnouncement: Announcement = {
    ...announcement,
    id: genId("an"),
    createdAt: new Date().toISOString(),
  };
  
  // ... existing code to save to Supabase ...
  
  // 📱 STUUR PUSH NOTIFICATIONS
  try {
    const enabledUsers = users.filter(u => u.notificationPreferences.newsEnabled);
    const enabledUserIds = enabledUsers.map(u => u.id);
    
    if (enabledUserIds.length > 0) {
      await notifyNewAnnouncement(
        newAnnouncement.name,
        newAnnouncement.description,
        newAnnouncement.id,
        enabledUserIds
      );
      console.log('✅ Notification sent for new announcement');
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
  
  setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ));
  console.log('✅ Announcement added');
}, [users]);
```

### Nieuw Huiswerk (Assignment)

In `providers/AppState.tsx`, update de `addAssignment` functie:

```typescript
import { notifyNewAssignment } from '@/lib/notification-service';

const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions' | 'completedBy'>) => {
  console.log('💾 Adding assignment to Supabase...');
  const newAssignment: Assignment = {
    ...assignment,
    id: genId("a"),
    createdAt: new Date().toISOString(),
    completedBy: [],
    submissions: [],
  };
  
  // ... existing code to save to Supabase ...
  
  // 📱 STUUR PUSH NOTIFICATIONS
  try {
    const assignedUsers = users.filter(u => 
      assignment.assignedUserIds.includes(u.id) && 
      u.notificationPreferences.assignmentsEnabled
    );
    const enabledUserIds = assignedUsers.map(u => u.id);
    
    if (enabledUserIds.length > 0) {
      await notifyNewAssignment(
        newAssignment.title,
        newAssignment.description,
        newAssignment.id,
        enabledUserIds
      );
      console.log('✅ Notification sent for new assignment');
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
  
  setAssignments((prev) => [newAssignment, ...prev]);
  console.log('✅ Assignment added:', newAssignment.id, newAssignment.title);
}, [users]);
```

### Training Wijziging

In `providers/AppState.tsx`, update de `updatePracticeSchedule` functie:

```typescript
import { notifyTrainingChange } from '@/lib/notification-service';

const updatePracticeSchedule = useCallback(async (schedule: PracticeSchedule) => {
  console.log('💾 Updating practice schedule in Supabase...');
  
  // ... existing code ...
  
  // 📱 STUUR NOTIFICATIONS BIJ TRAINING WIJZIGINGEN
  // Voor geannuleerde trainings
  const cancelledDates = schedule.cancelledDates.filter(cd => {
    return !practiceSchedule.cancelledDates.some(old => old.date === cd.date);
  });
  
  if (cancelledDates.length > 0) {
    try {
      const enabledUsers = users.filter(u => u.notificationPreferences.trainingsEnabled);
      const enabledUserIds = enabledUsers.map(u => u.id);
      
      for (const cancelled of cancelledDates) {
        await notifyTrainingChange(
          'Training',
          `Training op ${cancelled.date} is geannuleerd${cancelled.reason ? `: ${cancelled.reason}` : ''}`,
          '',
          enabledUserIds
        );
      }
      console.log('✅ Notification sent for cancelled training');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }
  
  // Voor extra trainings
  const newOneTimeTrainings = schedule.trainings.filter(t => {
    const existedBefore = practiceSchedule.trainings.find(old => old.id === t.id);
    return t.isOneTime && (!existedBefore || !existedBefore.isOneTime);
  });
  
  if (newOneTimeTrainings.length > 0) {
    try {
      const enabledUsers = users.filter(u => u.notificationPreferences.trainingsEnabled);
      const enabledUserIds = enabledUsers.map(u => u.id);
      
      for (const training of newOneTimeTrainings) {
        await notifyTrainingChange(
          training.name,
          `Extra training op ${training.time} in ${training.location}`,
          training.id,
          enabledUserIds
        );
      }
      console.log('✅ Notification sent for extra training');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }
  
  // ... rest of existing code ...
}, [practiceSchedule, users]);
```

### Nieuw Optreden (Appointment met categorie performance)

In `providers/AppState.tsx`, update de `addAppointment` functie:

```typescript
import { notifyNewPerformance } from '@/lib/notification-service';

const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy' | 'status'>) => {
  console.log('💾 Adding appointment to Supabase...');
  const newAppointment: Appointment = {
    ...appointment,
    id: genId("ap"),
    createdAt: new Date().toISOString(),
    createdBy: currentUser?.id ?? '',
    status: 'active',
  };
  
  // ... existing code to save to Supabase ...
  
  // 📱 STUUR PUSH NOTIFICATION ALS HET EEN OPTREDEN IS
  if (newAppointment.category !== 'Overig') {
    try {
      const enabledUsers = users.filter(u => u.notificationPreferences.performancesEnabled);
      const enabledUserIds = enabledUsers.map(u => u.id);
      
      if (enabledUserIds.length > 0) {
        await notifyNewPerformance(
          newAppointment.date,
          newAppointment.location,
          newAppointment.id,
          enabledUserIds
        );
        console.log('✅ Notification sent for new performance');
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }
  
  setAppointments((prev) => [...prev, newAppointment].sort((a, b) => 
    new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
  ));
  console.log('✅ Appointment added');
}, [currentUser, users]);
```

## 🧪 Testen

### 1. Basis Test
- Log in op een fysiek device (niet simulator)
- Check de meldingen pagina - de status indicator moet groen zijn
- De console moet tonen: "✅ [PUSH] Token saved to backend"

### 2. Notification Test
Gebruik de send-notification tRPC route om een test notification te versturen:

```typescript
await trpcClient.notifications.sendNotification.mutate({
  userIds: ['user_id_hier'],
  title: 'Test Notification',
  body: 'Dit is een test',
  data: { type: 'news' }
});
```

### 3. Content Creation Test
- Voeg een nieuwe aankondiging toe
- Gebruikers met newsEnabled=true moeten een notification krijgen
- Check de console logs voor "✅ Notification sent"

## 🔧 Troubleshooting

### Geen notifications ontvangen?
1. Check of de app toestemming heeft voor notifications
2. Check de console logs voor errors
3. Verifieer dat de push token opgeslagen is in de database
4. Test met een test notification via tRPC

### Token niet opgeslagen?
1. Check of je op een fysiek device bent (niet simulator/emulator)
2. Check de backend logs voor errors
3. Verifieer dat de SQL schema correct is uitgevoerd

### Notifications komen niet aan?
1. Check de notification_logs tabel in Supabase
2. Verifieer dat de Expo push token geldig is
3. Check of de user notification preferences correct zijn ingesteld

## 📋 Requirements voor Productie

Voor productie gebruik van push notifications heb je nodig:
1. **Expo Application Services (EAS)** account
2. **APNs (Apple Push Notification service)** certificaat voor iOS
3. **FCM (Firebase Cloud Messaging)** server key voor Android
4. Configuratie in `app.json` met je Expo project ID

Zie: https://docs.expo.dev/push-notifications/overview/

## 🎯 Volgende Stappen

1. Run het SQL script in Supabase
2. Test de notifications op een fysiek device
3. Voeg de notification service calls toe aan de content creation functies
4. Test elke notification type
5. Configureer EAS voor productie wanneer klaar

Succes met de implementatie!
