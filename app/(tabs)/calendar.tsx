import React, { useState, useMemo } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState, Appointment } from "@/providers/AppState";
import { Calendar as CalendarIcon, MapPin, Users, Plus, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const CATEGORIES: ('Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag')[] = ['Feestje', 'Verrassingsfeest', 'Huwelijk', 'Verjaardag'];

export default function CalendarScreen() {
  const { appointments, addAppointment, performances, practiceSchedule } = useAppState();
  const insets = useSafeAreaInsets();
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag';
    date: string;
    time: string;
    location: string;
    memberIds: string[];
  }>({
    name: '',
    category: 'Feestje',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    location: '',
    memberIds: [],
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showHourPicker, setShowHourPicker] = useState<boolean>(false);
  const [showMinutePicker, setShowMinutePicker] = useState<boolean>(false);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDay.toISOString().split('T')[0],
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: fullDate.toISOString().split('T')[0],
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: nextMonthDay.toISOString().split('T')[0],
      });
    }
    
    return days;
  }, [currentDate]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      if (!map[apt.date]) {
        map[apt.date] = [];
      }
      map[apt.date].push(apt);
    });
    return map;
  }, [appointments]);

  const trainingAndPerformanceDates = useMemo(() => {
    const dates = new Set<string>();
    
    performances.forEach((perf) => {
      dates.add(perf.date);
    });
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    practiceSchedule.trainings.forEach((training) => {
      let currentDay = new Date(firstDay);
      while (currentDay <= lastDay) {
        if (currentDay.getDay() === training.dayOfWeek) {
          const dateStr = currentDay.toISOString().split('T')[0];
          const isCancelled = practiceSchedule.cancelledDates.some(
            (cancelled) => cancelled.date === dateStr
          );
          if (!isCancelled) {
            dates.add(dateStr);
          }
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
    });
    
    return dates;
  }, [performances, practiceSchedule, currentDate]);

  const currentMonthAppointments = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate.getFullYear() === year && aptDate.getMonth() === month;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments, currentDate]);



  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddAppointment = () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      return;
    }

    addAppointment({
      name: formData.name.trim(),
      category: formData.category,
      date: formData.date,
      time: formData.time,
      location: formData.location.trim(),
      memberIds: formData.memberIds,
    });

    setFormData({
      name: '',
      category: 'Feestje',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      location: '',
      memberIds: [],
    });
    setShowAddModal(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="calendar-screen">
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.25, 1]}
        />
        
        <View style={styles.header}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Agenda</Text>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
              <ChevronLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
              <ChevronRight color={Colors.light.primary} size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <View key={day} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const hasAppointments = appointmentsByDate[day.fullDate]?.length > 0;
              const isToday = day.fullDate === today;
              const hasTrainingOrPerformance = trainingAndPerformanceDates.has(day.fullDate);
              
              return (
                <View key={`${day.fullDate}-${index}`} style={styles.dayCell}>
                  <View style={[
                    styles.dayNumber,
                    !day.isCurrentMonth && styles.dayNumberInactive,
                    isToday && styles.dayNumberToday,
                    hasTrainingOrPerformance && day.isCurrentMonth && styles.dayNumberCircled,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.dayTextInactive,
                      isToday && styles.dayTextToday,
                    ]}>
                      {day.date}
                    </Text>
                  </View>
                  {hasAppointments && day.isCurrentMonth && (
                    <View style={styles.appointmentDot} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.appointmentsHeader}>
          <Text style={styles.appointmentsTitle}>{MONTHS[currentDate.getMonth()]} Afspraken</Text>
          <Text style={styles.appointmentsCount}>{currentMonthAppointments.length}</Text>
        </View>

        <FlatList
          data={currentMonthAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => {
            const dateObj = new Date(item.date);
            const formattedDate = `${dateObj.getDate()} ${MONTHS[dateObj.getMonth()].slice(0, 3)} ${dateObj.getFullYear()}`;
            
            return (
              <View style={styles.card}>
                <View style={styles.cardColorStrip} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <CalendarIcon color={Colors.light.muted} size={14} strokeWidth={2} />
                      <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>{item.time}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin color={Colors.light.muted} size={14} strokeWidth={2} />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  </View>

                  {item.memberIds.length > 0 && (
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users color={Colors.light.muted} size={14} strokeWidth={2} />
                        <Text style={styles.metaText}>{item.memberIds.length} leden</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CalendarIcon color={Colors.light.muted} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Nog geen afspraken deze maand</Text>
            </View>
          }
        />

        <Pressable 
          style={[styles.fab, { bottom: insets.bottom + 20 }]} 
          onPress={() => setShowAddModal(true)}
          testID="add-appointment-fab"
        >
          <LinearGradient
            colors={[Colors.light.primary, '#B91C1C']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color={Colors.light.text} size={28} strokeWidth={3} />
          </LinearGradient>
        </Pressable>
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nieuwe Afspraak</Text>
                <Pressable onPress={() => setShowAddModal(false)} testID="close-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Naam</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Naam van de afspraak"
                  placeholderTextColor={Colors.light.muted}
                  testID="name-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categorie</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  testID="category-dropdown"
                >
                  <Text style={styles.dropdownText}>{formData.category}</Text>
                  <ChevronRight 
                    color={Colors.light.muted} 
                    size={20} 
                    style={{ transform: [{ rotate: showCategoryDropdown ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenu}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, category });
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.category === category && styles.dropdownItemTextActive
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Datum</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  testID="date-picker-button"
                >
                  <Text style={styles.dropdownText}>
                    {new Date(formData.date).toLocaleDateString('nl-NL', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <CalendarIcon color={Colors.light.muted} size={20} />
                </Pressable>
                {showDatePicker && (
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity 
                        onPress={() => {
                          const newDate = new Date(formData.date);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setFormData({ ...formData, date: newDate.toISOString().split('T')[0] });
                        }}
                        style={styles.datePickerButton}
                      >
                        <ChevronLeft color={Colors.light.primary} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.datePickerMonth}>
                        {new Date(formData.date).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          const newDate = new Date(formData.date);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setFormData({ ...formData, date: newDate.toISOString().split('T')[0] });
                        }}
                        style={styles.datePickerButton}
                      >
                        <ChevronRight color={Colors.light.primary} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerDays}>
                      {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day) => (
                        <View key={day} style={styles.datePickerWeekDay}>
                          <Text style={styles.datePickerWeekDayText}>{day}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.datePickerGrid}>
                      {(() => {
                        const selectedDate = new Date(formData.date);
                        const year = selectedDate.getFullYear();
                        const month = selectedDate.getMonth();
                        const firstDay = new Date(year, month, 1);
                        const lastDay = new Date(year, month + 1, 0);
                        const startDayOfWeek = firstDay.getDay();
                        const daysInMonth = lastDay.getDate();
                        const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
                        
                        for (let i = 0; i < startDayOfWeek; i++) {
                          const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
                          days.push({
                            date: prevMonthDay.getDate(),
                            isCurrentMonth: false,
                            fullDate: prevMonthDay.toISOString().split('T')[0],
                          });
                        }
                        
                        for (let i = 1; i <= daysInMonth; i++) {
                          const fullDate = new Date(year, month, i);
                          days.push({
                            date: i,
                            isCurrentMonth: true,
                            fullDate: fullDate.toISOString().split('T')[0],
                          });
                        }
                        
                        const remainingDays = 42 - days.length;
                        for (let i = 1; i <= remainingDays; i++) {
                          const nextMonthDay = new Date(year, month + 1, i);
                          days.push({
                            date: i,
                            isCurrentMonth: false,
                            fullDate: nextMonthDay.toISOString().split('T')[0],
                          });
                        }
                        
                        return days.map((day, index) => (
                          <TouchableOpacity
                            key={`${day.fullDate}-${index}`}
                            style={styles.datePickerDay}
                            onPress={() => {
                              setFormData({ ...formData, date: day.fullDate });
                              setShowDatePicker(false);
                            }}
                          >
                            <View style={[
                              styles.datePickerDayContent,
                              !day.isCurrentMonth && styles.datePickerDayInactive,
                              day.fullDate === formData.date && styles.datePickerDaySelected,
                            ]}>
                              <Text style={[
                                styles.datePickerDayText,
                                !day.isCurrentMonth && styles.datePickerDayTextInactive,
                                day.fullDate === formData.date && styles.datePickerDayTextSelected,
                              ]}>
                                {day.date}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ));
                      })()}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tijd</Text>
                <View style={styles.timePickerRow}>
                  <Pressable
                    style={[styles.dropdownButton, { flex: 1 }]}
                    onPress={() => {
                      setShowHourPicker(!showHourPicker);
                      setShowMinutePicker(false);
                    }}
                    testID="hour-picker-button"
                  >
                    <Text style={styles.dropdownText}>{formData.time.split(':')[0]}</Text>
                    <ChevronRight 
                      color={Colors.light.muted} 
                      size={20} 
                      style={{ transform: [{ rotate: showHourPicker ? '90deg' : '0deg' }] }}
                    />
                  </Pressable>
                  <Text style={styles.timeColon}>:</Text>
                  <Pressable
                    style={[styles.dropdownButton, { flex: 1 }]}
                    onPress={() => {
                      setShowMinutePicker(!showMinutePicker);
                      setShowHourPicker(false);
                    }}
                    testID="minute-picker-button"
                  >
                    <Text style={styles.dropdownText}>{formData.time.split(':')[1]}</Text>
                    <ChevronRight 
                      color={Colors.light.muted} 
                      size={20} 
                      style={{ transform: [{ rotate: showMinutePicker ? '90deg' : '0deg' }] }}
                    />
                  </Pressable>
                </View>
                {showHourPicker && (
                  <ScrollView style={styles.timePickerMenu} nestedScrollEnabled>
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={styles.timePickerItem}
                        onPress={() => {
                          const minutes = formData.time.split(':')[1];
                          setFormData({ ...formData, time: `${hour}:${minutes}` });
                          setShowHourPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.timePickerText,
                          formData.time.split(':')[0] === hour && styles.timePickerTextActive
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {showMinutePicker && (
                  <View style={styles.timePickerMenu}>
                    {['00', '15', '30', '45'].map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={styles.timePickerItem}
                        onPress={() => {
                          const hour = formData.time.split(':')[0];
                          setFormData({ ...formData, time: `${hour}:${minute}` });
                          setShowMinutePicker(false);
                        }}
                      >
                        <Text style={[
                          styles.timePickerText,
                          formData.time.split(':')[1] === minute && styles.timePickerTextActive
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Locatie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Locatie van de afspraak"
                  placeholderTextColor={Colors.light.muted}
                  testID="location-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Leden</Text>
                <Text style={styles.inputHint}>
                  {formData.memberIds.length > 0 
                    ? `${formData.memberIds.length} ${formData.memberIds.length === 1 ? 'lid' : 'leden'} geselecteerd`
                    : 'Geen leden geselecteerd'}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      category: 'Feestje',
                      date: new Date().toISOString().split('T')[0],
                      time: '12:00',
                      location: '',
                      memberIds: [],
                    });
                  }}
                  testID="cancel-button"
                >
                  <Text style={styles.cancelButtonText}>Annuleren</Text>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.actionButton, 
                    styles.createButton, 
                    (!formData.name.trim() || !formData.location.trim()) && styles.disabledButton
                  ]}
                  onPress={handleAddAppointment}
                  disabled={!formData.name.trim() || !formData.location.trim()}
                  testID="create-button"
                >
                  <LinearGradient
                    colors={(formData.name.trim() && formData.location.trim()) 
                      ? [Colors.light.primary, Colors.light.primaryDark] 
                      : [Colors.light.surfaceLight, Colors.light.surfaceLight]
                    }
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[
                      styles.createButtonText, 
                      (!formData.name.trim() || !formData.location.trim()) && styles.disabledButtonText
                    ]}>
                      Toevoegen
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background,
  },
  headerBg: { 
    position: "absolute", 
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
    color: Colors.light.text, 
    fontSize: 36, 
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberInactive: {
    opacity: 0.3,
  },
  dayNumberToday: {
    backgroundColor: Colors.light.primary,
  },
  dayNumberCircled: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  dayText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayTextInactive: {
    color: Colors.light.muted,
  },
  dayTextToday: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  appointmentsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentsTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  appointmentsCount: {
    color: Colors.light.muted,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  list: { 
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: 'row',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardColorStrip: {
    width: 4,
    backgroundColor: Colors.light.primary,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { 
    color: Colors.light.text, 
    fontSize: 18, 
    fontWeight: "700" as const,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryText: {
    color: Colors.light.text,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { 
    color: Colors.light.muted, 
    fontSize: 13,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: Colors.light.muted,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800' as const,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  inputHint: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  input: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dropdownButton: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceLight,
  },
  dropdownItemText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  dropdownItemTextActive: {
    color: Colors.light.primary,
    fontWeight: '700' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  createButton: {
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: Colors.light.muted,
  },
  datePickerModal: {
    marginTop: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerButton: {
    padding: 4,
  },
  datePickerMonth: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  datePickerDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  datePickerWeekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  datePickerWeekDayText: {
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  datePickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  datePickerDayContent: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDayInactive: {
    opacity: 0.3,
  },
  datePickerDaySelected: {
    backgroundColor: Colors.light.primary,
  },
  datePickerDayText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  datePickerDayTextInactive: {
    color: Colors.light.muted,
  },
  datePickerDayTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeColon: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  timePickerMenu: {
    marginTop: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    maxHeight: 200,
  },
  timePickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceLight,
    alignItems: 'center',
  },
  timePickerText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  timePickerTextActive: {
    color: Colors.light.primary,
    fontWeight: '700' as const,
  },
});
