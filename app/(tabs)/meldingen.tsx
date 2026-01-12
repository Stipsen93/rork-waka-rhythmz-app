import { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import { useNotifications } from "@/providers/NotificationProvider";
import { Bell, Newspaper, FileText, Calendar, AlertCircle, Users, ChevronDown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { translations } from "@/constants/translations";

type TimeOption = { label: string; hours: number };

export default function MeldingenScreen() {
  const insets = useSafeAreaInsets();
  const { notificationSettings, updateNotificationSettings, users, updateUserNotificationPreferences, language } = useAppState();
  const { isRegistered, isLoading, permissionStatus, diagnostics, registerForPushNotifications, requestPermissions, refreshPushState } = useNotifications();
  const t = translations[language];
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);

  useEffect(() => {
    console.log('📱 [MELDINGEN] Refreshing push state on mount...');
    refreshPushState();
  }, [refreshPushState]);
  
  const currentUser = useAppState().currentUser;
  
  const isAdmin = currentUser?.role === 'admin';
  const isMember = currentUser?.role === 'member';

  const [localSettings, setLocalSettings] = useState({
    newsEnabled: currentUser?.notificationPreferences.newsEnabled ?? true,
    assignmentsEnabled: currentUser?.notificationPreferences.assignmentsEnabled ?? true,
    trainingsEnabled: currentUser?.notificationPreferences.trainingsEnabled ?? true,
    performancesEnabled: currentUser?.notificationPreferences.performancesEnabled ?? true,
  });

  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [localNotificationSettings, setLocalNotificationSettings] = useState({
    newsHoursAdvance: notificationSettings.newsHoursAdvance,
    assignmentsHoursAdvance: notificationSettings.assignmentsHoursAdvance,
    trainingHoursAdvance: notificationSettings.trainingHoursAdvance,
    performancesHoursAdvance: notificationSettings.performancesHoursAdvance,
  });

  const members = useMemo(() => users.filter(u => u.role === 'member'), [users]);

  const getMembersForCategory = (category: 'news' | 'assignments' | 'trainings' | 'performances') => {
    return members.filter(m => {
      switch(category) {
        case 'news': return m.notificationPreferences.newsEnabled;
        case 'assignments': return m.notificationPreferences.assignmentsEnabled;
        case 'trainings': return m.notificationPreferences.trainingsEnabled;
        case 'performances': return m.notificationPreferences.performancesEnabled;
        default: return false;
      }
    });
  };

  const toggleMemberNotification = async (userId: string, category: 'news' | 'assignments' | 'trainings' | 'performances') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPrefs = { ...user.notificationPreferences };
    switch(category) {
      case 'news': newPrefs.newsEnabled = !newPrefs.newsEnabled; break;
      case 'assignments': newPrefs.assignmentsEnabled = !newPrefs.assignmentsEnabled; break;
      case 'trainings': newPrefs.trainingsEnabled = !newPrefs.trainingsEnabled; break;
      case 'performances': newPrefs.performancesEnabled = !newPrefs.performancesEnabled; break;
    }

    await updateUserNotificationPreferences(userId, newPrefs);
  };

  const TIME_OPTIONS: TimeOption[] = useMemo(() => [
    { label: t.notifications.timeOptions.hour1, hours: 1 },
    { label: t.notifications.timeOptions.hour2, hours: 2 },
    { label: t.notifications.timeOptions.hour3, hours: 3 },
    { label: t.notifications.timeOptions.hour6, hours: 6 },
    { label: t.notifications.timeOptions.hour12, hours: 12 },
    { label: t.notifications.timeOptions.hour24, hours: 24 },
    { label: t.notifications.timeOptions.hour48, hours: 48 },
    { label: t.notifications.timeOptions.day3, hours: 72 },
    { label: t.notifications.timeOptions.day7, hours: 168 },
  ], [t]);

  const getTimeLabel = (hours: number): string => {
    const option = TIME_OPTIONS.find(opt => opt.hours === hours);
    return option ? option.label : `${hours} ${t.notifications.timeOptions.hour1.split(' ')[1]}`;
  };

  const saveSettings = async () => {
    if (!currentUser) return;
    
    if (isMember) {
      await updateUserNotificationPreferences(currentUser.id, localSettings);
      Alert.alert(t.notifications.saved, t.notifications.settingsUpdated);
    } else if (isAdmin) {
      Alert.alert(t.notifications.saved, 'Admin instellingen worden centraal beheerd');
    }
  };

  const toggleLocalSetting = async (category: 'news' | 'assignments' | 'trainings' | 'performances') => {
    if (!currentUser || !isMember) return;
    
    const newSettings = { ...localSettings };
    switch(category) {
      case 'news': newSettings.newsEnabled = !newSettings.newsEnabled; break;
      case 'assignments': newSettings.assignmentsEnabled = !newSettings.assignmentsEnabled; break;
      case 'trainings': newSettings.trainingsEnabled = !newSettings.trainingsEnabled; break;
      case 'performances': newSettings.performancesEnabled = !newSettings.performancesEnabled; break;
    }
    
    setLocalSettings(newSettings);
    await updateUserNotificationPreferences(currentUser.id, newSettings);
  };

  const updateAdminNotificationHours = async (category: 'news' | 'assignments' | 'trainings' | 'performances', hours: number) => {
    if (!isAdmin) return;
    
    const newSettings = { ...notificationSettings };
    switch(category) {
      case 'news': newSettings.newsHoursAdvance = hours; break;
      case 'assignments': newSettings.assignmentsHoursAdvance = hours; break;
      case 'trainings': newSettings.trainingHoursAdvance = hours; break;
      case 'performances': newSettings.performancesHoursAdvance = hours; break;
    }
    
    const key = category === 'trainings' ? 'trainingHoursAdvance' : `${category}HoursAdvance`;
    setLocalNotificationSettings(prev => ({
      ...prev,
      [key]: hours,
    }));
    
    await updateNotificationSettings(newSettings);
    setShowDropdown(null);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "OneBand",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800" as const,
            letterSpacing: 1,
          },
          headerLeft: () => <MenuButton onPress={() => setShowMenuModal(true)} />,
          headerStyle: { backgroundColor: Colors.light.background },
          headerShadowVisible: false,
        }} 
      />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.25, 1]}
        />
        
        <View style={styles.header}>
          <Text style={styles.appName}>OneBand</Text>
          <Text style={styles.title}>{t.notifications.title}</Text>
          <Text style={styles.subtitle}>{t.notifications.subtitle}</Text>
          
          <View style={styles.statusBanner}>
            <View style={styles.statusBannerLeft}>
              <View style={[styles.statusDot, isRegistered && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isLoading ? '⏳ Bezig met activeren...' : isRegistered ? '✓ Push notificaties actief' : '○ Push notificaties niet actief'}
              </Text>
            </View>
            {!isRegistered && !isLoading && (
              <TouchableOpacity
                style={styles.activateButton}
                onPress={async () => {
                  await requestPermissions();
                }}
                testID="push-activate"
              >
                <Text style={styles.activateButtonText}>Activeren</Text>
              </TouchableOpacity>
            )}
          </View>
          {(!diagnostics.overallEnabled && !isRegistered) && (
            <View style={styles.permissionWarning} testID="push-warning">
              <AlertCircle color="#FF6B6B" size={16} strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionWarningText}>
                  Push notificaties lijken op dit apparaat uit te staan.
                  {Platform.OS === 'android' && diagnostics.androidChannel?.blocked
                    ? ' (Android kanaal is geblokkeerd)'
                    : ''}
                </Text>
                <TouchableOpacity
                  style={styles.permissionCta}
                  onPress={async () => {
                    await refreshPushState();
                    if (permissionStatus === 'granted') {
                      await registerForPushNotifications();
                    }
                  }}
                  testID="push-recheck"
                >
                  <Text style={styles.permissionCtaText}>Opnieuw controleren</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* NIEUWS */}
          <TouchableOpacity 
            style={styles.notificationCard}
            onPress={() => setExpandedCategory(expandedCategory === 'news' ? null : 'news')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Newspaper color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.news}</Text>
              </View>
              <ChevronDown 
                color={Colors.light.muted} 
                size={20} 
                strokeWidth={2.5}
                style={[styles.chevron, expandedCategory === 'news' && styles.chevronExpanded]}
              />
            </View>
            
            {expandedCategory === 'news' && (
              <View style={styles.cardContent}>
                {isAdmin && (
                  <>
                    {/* Direct Melding Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Melding ontvangen als er een nieuw bericht is toegevoegd</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.newsEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              newsEnabled: !notificationSettings.newsEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.newsEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Herinnering Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Herinnering sturen voor datum in nieuws</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.newsReminderEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              newsReminderEnabled: !notificationSettings.newsReminderEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.newsReminderEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Hoeveel Uur van Tevoren */}
                    {notificationSettings.newsReminderEnabled && (
                      <View style={styles.settingRow}>
                        <View style={styles.timeRow}>
                          <Text style={styles.toggleLabel}>Hoeveel uur van tevoren</Text>
                          <TouchableOpacity 
                            style={styles.timeSelector}
                            onPress={() => setShowDropdown('news')}
                          >
                            <Text style={styles.timeSelectorText}>{getTimeLabel(localNotificationSettings.newsHoursAdvance)}</Text>
                            <ChevronDown color={Colors.light.text} size={18} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.membersSection}
                      onPress={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <View style={styles.membersSectionHeader}>
                        <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.membersSectionTitle}>
                          {getMembersForCategory('news').length} / {members.length} {t.notifications.membersReceiving}
                        </Text>
                      </View>
                      <View style={styles.membersList}>
                        {members.map(member => {
                          const isEnabled = member.notificationPreferences.newsEnabled;
                          return (
                            <TouchableOpacity
                              key={member.id}
                              style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                              onPress={() => toggleMemberNotification(member.id, 'news')}
                            >
                              <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                                {member.username}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {isMember && (
                  <View style={styles.toggleSection}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t.notifications.receiveNewsNotifications}</Text>
                      <TouchableOpacity
                        style={[styles.toggle, localSettings.newsEnabled && styles.toggleActive]}
                        onPress={() => toggleLocalSetting('news')}
                      >
                        <View style={[styles.toggleThumb, localSettings.newsEnabled && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.settingDescription}>
                      {localSettings.newsEnabled ? 'Je ontvangt nieuws meldingen op dit apparaat' : 'Je ontvangt geen nieuws meldingen op dit apparaat'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* HUISWERK */}
          <TouchableOpacity 
            style={styles.notificationCard}
            onPress={() => setExpandedCategory(expandedCategory === 'assignments' ? null : 'assignments')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <FileText color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.homework}</Text>
              </View>
              <ChevronDown 
                color={Colors.light.muted} 
                size={20} 
                strokeWidth={2.5}
                style={[styles.chevron, expandedCategory === 'assignments' && styles.chevronExpanded]}
              />
            </View>
            
            {expandedCategory === 'assignments' && (
              <View style={styles.cardContent}>
                {isAdmin && (
                  <>
                    {/* Direct Melding Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Melding ontvangen als er een nieuw huiswerk item is toegevoegd</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.assignmentsEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              assignmentsEnabled: !notificationSettings.assignmentsEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.assignmentsEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Herinnering Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Herinnering sturen voor deadline huiswerk</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.assignmentsReminderEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              assignmentsReminderEnabled: !notificationSettings.assignmentsReminderEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.assignmentsReminderEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Hoeveel Uur van Tevoren */}
                    {notificationSettings.assignmentsReminderEnabled && (
                      <View style={styles.settingRow}>
                        <View style={styles.timeRow}>
                          <Text style={styles.toggleLabel}>Hoeveel uur van tevoren</Text>
                          <TouchableOpacity 
                            style={styles.timeSelector}
                            onPress={() => setShowDropdown('assignments')}
                          >
                            <Text style={styles.timeSelectorText}>{getTimeLabel(localNotificationSettings.assignmentsHoursAdvance)}</Text>
                            <ChevronDown color={Colors.light.text} size={18} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.membersSection}
                      onPress={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <View style={styles.membersSectionHeader}>
                        <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.membersSectionTitle}>
                          {getMembersForCategory('assignments').length} / {members.length} {t.notifications.membersReceiving}
                        </Text>
                      </View>
                      <View style={styles.membersList}>
                        {members.map(member => {
                          const isEnabled = member.notificationPreferences.assignmentsEnabled;
                          return (
                            <TouchableOpacity
                              key={member.id}
                              style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                              onPress={() => toggleMemberNotification(member.id, 'assignments')}
                            >
                              <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                                {member.username}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {isMember && (
                  <View style={styles.toggleSection}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t.notifications.receiveHomeworkNotifications}</Text>
                      <TouchableOpacity
                        style={[styles.toggle, localSettings.assignmentsEnabled && styles.toggleActive]}
                        onPress={() => toggleLocalSetting('assignments')}
                      >
                        <View style={[styles.toggleThumb, localSettings.assignmentsEnabled && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.settingDescription}>
                      {localSettings.assignmentsEnabled ? 'Je ontvangt huiswerk meldingen op dit apparaat' : 'Je ontvangt geen huiswerk meldingen op dit apparaat'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* TRAININGEN */}
          <TouchableOpacity 
            style={styles.notificationCard}
            onPress={() => setExpandedCategory(expandedCategory === 'trainings' ? null : 'trainings')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <AlertCircle color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.trainings}</Text>
              </View>
              <ChevronDown 
                color={Colors.light.muted} 
                size={20} 
                strokeWidth={2.5}
                style={[styles.chevron, expandedCategory === 'trainings' && styles.chevronExpanded]}
              />
            </View>
            
            {expandedCategory === 'trainings' && (
              <View style={styles.cardContent}>
                {isAdmin && (
                  <>
                    {/* Direct Melding Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Melding ontvangen als er een nieuwe training is toegevoegd</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.trainingCancellationEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              trainingCancellationEnabled: !notificationSettings.trainingCancellationEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.trainingCancellationEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Herinnering Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Herinnering sturen voor training</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.trainingsReminderEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              trainingsReminderEnabled: !notificationSettings.trainingsReminderEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.trainingsReminderEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Hoeveel Uur van Tevoren */}
                    {notificationSettings.trainingsReminderEnabled && (
                      <View style={styles.settingRow}>
                        <View style={styles.timeRow}>
                          <Text style={styles.toggleLabel}>Hoeveel uur van tevoren</Text>
                          <TouchableOpacity 
                            style={styles.timeSelector}
                            onPress={() => setShowDropdown('trainings')}
                          >
                            <Text style={styles.timeSelectorText}>{getTimeLabel(localNotificationSettings.trainingHoursAdvance)}</Text>
                            <ChevronDown color={Colors.light.text} size={18} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.membersSection}
                      onPress={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <View style={styles.membersSectionHeader}>
                        <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.membersSectionTitle}>
                          {getMembersForCategory('trainings').length} / {members.length} {t.notifications.membersReceiving}
                        </Text>
                      </View>
                      <View style={styles.membersList}>
                        {members.map(member => {
                          const isEnabled = member.notificationPreferences.trainingsEnabled;
                          return (
                            <TouchableOpacity
                              key={member.id}
                              style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                              onPress={() => toggleMemberNotification(member.id, 'trainings')}
                            >
                              <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                                {member.username}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {isMember && (
                  <View style={styles.toggleSection}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t.notifications.receiveTrainingNotifications}</Text>
                      <TouchableOpacity
                        style={[styles.toggle, localSettings.trainingsEnabled && styles.toggleActive]}
                        onPress={() => toggleLocalSetting('trainings')}
                      >
                        <View style={[styles.toggleThumb, localSettings.trainingsEnabled && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.settingDescription}>
                      {localSettings.trainingsEnabled ? 'Je ontvangt training meldingen op dit apparaat' : 'Je ontvangt geen training meldingen op dit apparaat'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* OPTREDENS */}
          <TouchableOpacity 
            style={styles.notificationCard}
            onPress={() => setExpandedCategory(expandedCategory === 'performances' ? null : 'performances')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.performances}</Text>
              </View>
              <ChevronDown 
                color={Colors.light.muted} 
                size={20} 
                strokeWidth={2.5}
                style={[styles.chevron, expandedCategory === 'performances' && styles.chevronExpanded]}
              />
            </View>
            
            {expandedCategory === 'performances' && (
              <View style={styles.cardContent}>
                {isAdmin && (
                  <>
                    {/* Direct Melding Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Melding ontvangen als er een nieuw optreden is toegevoegd</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.performancesEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              performancesEnabled: !notificationSettings.performancesEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.performancesEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Herinnering Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Herinnering sturen voor optreden</Text>
                        <TouchableOpacity
                          style={[styles.toggle, notificationSettings.performancesReminderEnabled && styles.toggleActive]}
                          onPress={async () => {
                            await updateNotificationSettings({
                              ...notificationSettings,
                              performancesReminderEnabled: !notificationSettings.performancesReminderEnabled,
                            });
                          }}
                        >
                          <View style={[styles.toggleThumb, notificationSettings.performancesReminderEnabled && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Hoeveel Uur van Tevoren */}
                    {notificationSettings.performancesReminderEnabled && (
                      <View style={styles.settingRow}>
                        <View style={styles.timeRow}>
                          <Text style={styles.toggleLabel}>Hoeveel uur van tevoren</Text>
                          <TouchableOpacity 
                            style={styles.timeSelector}
                            onPress={() => setShowDropdown('performances')}
                          >
                            <Text style={styles.timeSelectorText}>{getTimeLabel(localNotificationSettings.performancesHoursAdvance)}</Text>
                            <ChevronDown color={Colors.light.text} size={18} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.membersSection}
                      onPress={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <View style={styles.membersSectionHeader}>
                        <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.membersSectionTitle}>
                          {getMembersForCategory('performances').length} / {members.length} {t.notifications.membersReceiving}
                        </Text>
                      </View>
                      <View style={styles.membersList}>
                        {members.map(member => {
                          const isEnabled = member.notificationPreferences.performancesEnabled;
                          return (
                            <TouchableOpacity
                              key={member.id}
                              style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                              onPress={() => toggleMemberNotification(member.id, 'performances')}
                            >
                              <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                                {member.username}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {isMember && (
                  <View style={styles.toggleSection}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t.notifications.receivePerformanceNotifications}</Text>
                      <TouchableOpacity
                        style={[styles.toggle, localSettings.performancesEnabled && styles.toggleActive]}
                        onPress={() => toggleLocalSetting('performances')}
                      >
                        <View style={[styles.toggleThumb, localSettings.performancesEnabled && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.settingDescription}>
                      {localSettings.performancesEnabled ? 'Je ontvangt optreden meldingen op dit apparaat' : 'Je ontvangt geen optreden meldingen op dit apparaat'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Bell color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>{t.notifications.saveSettings}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(null)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>{t.notifications.selectTime}</Text>
              <ScrollView style={styles.dropdownScroll}>
                {TIME_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.hours}
                    style={styles.dropdownOption}
                    onPress={() => {
                      if (showDropdown === 'news') {
                        updateAdminNotificationHours('news', option.hours);
                      } else if (showDropdown === 'assignments') {
                        updateAdminNotificationHours('assignments', option.hours);
                      } else if (showDropdown === 'trainings') {
                        updateAdminNotificationHours('trainings', option.hours);
                      } else if (showDropdown === 'performances') {
                        updateAdminNotificationHours('performances', option.hours);
                      }
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerBg: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.4,
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appName: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "900" as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.light.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.muted,
    marginTop: 8,
    fontWeight: "500" as const,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  notificationCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  cardHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.darkGray,
    padding: 2,
    justifyContent: "center" as const,
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.surface,
  },
  toggleThumbActive: {
    alignSelf: "flex-end" as const,
  },
  cardContent: {
    marginTop: 16,
    gap: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  timeSelector: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  timeSelectorText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  toggleSection: {
    gap: 8,
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  dropdownModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center" as const,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  membersSection: {
    marginTop: 12,
  },
  membersSectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    marginBottom: 12,
  },
  membersSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  membersList: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 12,
  },
  memberChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1.5,
    borderColor: Colors.light.surfaceLight,
  },
  memberChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.muted,
  },
  memberChipTextActive: {
    color: Colors.light.text,
  },
  statusBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  statusBannerLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.darkGray,
  },
  statusDotActive: {
    backgroundColor: "#4CAF50" as const,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 8,
    fontWeight: "500" as const,
    fontStyle: "italic" as const,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  activateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  activateButtonText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  permissionWarning: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFF5F5" as const,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0E0" as const,
  },
  permissionWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#FF6B6B" as const,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
  permissionCta: {
    marginTop: 10,
    alignSelf: "flex-start" as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FF6B6B" as const,
  },
  permissionCtaText: {
    color: "#FFFFFF" as const,
    fontSize: 12,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  settingRow: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "column" as const,
    gap: 8,
  },
});
