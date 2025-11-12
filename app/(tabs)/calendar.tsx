import React, { useState, useMemo } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState, Appointment } from "@/providers/AppState";
import { Calendar as CalendarIcon, MapPin, Users, Plus, X, ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const CATEGORIES: ('Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig')[] = ['Feestje', 'Verrassingsfeest', 'Huwelijk', 'Verjaardag', 'Overig'];

const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function CalendarScreen() {
  const { appointments, addAppointment, updateAppointment, deleteAppointments, performances, practiceSchedule, users, currentUser } = useAppState();
  const insets = useSafeAreaInsets();
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig';
    date: string;
    time: string;
    location: string;
    memberIds: string[];
    forUserId?: string;
    confirmed: boolean;
  }>({
    name: '',
    category: 'Feestje',
    date: formatDateToLocal(new Date()),
    time: '12:00',
    location: '',
    memberIds: [],
    forUserId: undefined,
    confirmed: false,
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showForUserDropdown, setShowForUserDropdown] = useState<boolean>(false);
  const [showEditForUserDropdown, setShowEditForUserDropdown] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showHourPicker, setShowHourPicker] = useState<boolean>(false);
  const [showMinutePicker, setShowMinutePicker] = useState<boolean>(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState<boolean>(false);
  const [editPickerMonth, setEditPickerMonth] = useState<Date>(new Date());

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig';
    date: string;
    time: string;
    location: string;
    memberIds: string[];
    forUserId?: string;
    confirmed: boolean;
  }>({
    name: '',
    category: 'Feestje',
    date: formatDateToLocal(new Date()),
    time: '12:00',
    location: '',
    memberIds: [],
    forUserId: undefined,
    confirmed: false,
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    
    const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: formatDateToLocal(prevMonthDay),
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: formatDateToLocal(fullDate),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: formatDateToLocal(nextMonthDay),
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

  const performanceDates = useMemo(() => {
    const dates = new Set<string>();
    performances.forEach((perf) => {
      dates.add(perf.date);
    });
    return dates;
  }, [performances]);

  const practiceDates = useMemo(() => {
    const dates = new Set<string>();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    practiceSchedule.trainings.forEach((training) => {
      let currentDay = new Date(firstDay);
      while (currentDay <= lastDay) {
        if (currentDay.getDay() === training.dayOfWeek) {
          const dateStr = formatDateToLocal(currentDay);
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
  }, [practiceSchedule, currentDate]);

  const extraTrainingDates = useMemo(() => {
    const dates = new Set<string>();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    practiceSchedule.trainings.forEach((training) => {
      if (!training.isOneTime) return;
      
      let currentDay = new Date(firstDay);
      while (currentDay <= lastDay) {
        if (currentDay.getDay() === training.dayOfWeek) {
          const dateStr = formatDateToLocal(currentDay);
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
  }, [practiceSchedule, currentDate]);

  const birthdayDates = useMemo(() => {
    const dates = new Set<string>();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    users.forEach((user) => {
      if (!user.age) return;
      
      const [birthYear, birthMonth, birthDay] = user.age.split('-').map(Number);
      if (birthMonth - 1 === month) {
        const birthdayThisYear = new Date(year, month, birthDay);
        dates.add(formatDateToLocal(birthdayThisYear));
      }
    });
    
    return dates;
  }, [users, currentDate]);

  const currentMonthAppointments = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return appointments.filter((apt) => {
      const aptDate = parseDateString(apt.date);
      return aptDate.getFullYear() === year && aptDate.getMonth() === month;
    }).sort((a, b) => {
      const dateA = parseDateString(a.date);
      const timeA = a.time.split(':').map(Number);
      dateA.setHours(timeA[0], timeA[1]);
      
      const dateB = parseDateString(b.date);
      const timeB = b.time.split(':').map(Number);
      dateB.setHours(timeB[0], timeB[1]);
      
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
      forUserId: formData.forUserId,
      confirmed: formData.confirmed,
    } as any);

    setFormData({
      name: '',
      category: 'Feestje',
      date: formatDateToLocal(new Date()),
      time: '12:00',
      location: '',
      memberIds: [],
      forUserId: undefined,
      confirmed: false,
    });
    setShowAddModal(false);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData({
      name: appointment.name,
      category: appointment.category,
      date: appointment.date,
      time: appointment.time,
      location: appointment.location,
      memberIds: appointment.memberIds,
      forUserId: appointment.forUserId,
      confirmed: appointment.confirmed,
    });
    setShowEditModal(true);
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment || !editFormData.name.trim() || !editFormData.location.trim()) {
      return;
    }

    updateAppointment(selectedAppointment.id, {
      name: editFormData.name.trim(),
      category: editFormData.category,
      date: editFormData.date,
      time: editFormData.time,
      location: editFormData.location.trim(),
      memberIds: editFormData.memberIds,
      forUserId: editFormData.forUserId,
      confirmed: editFormData.confirmed,
    } as any);

    setShowEditModal(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    
    Alert.alert(
      'Afspraak Annuleren',
      'Weet je zeker dat je deze afspraak wilt annuleren?',
      [
        { text: 'Nee', style: 'cancel' },
        {
          text: 'Ja',
          onPress: () => {
            updateAppointment(selectedAppointment.id, { status: 'cancelled' });
            setShowEditModal(false);
            setSelectedAppointment(null);
          },
        },
      ]
    );
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;
    
    Alert.alert(
      'Afspraak Verwijderen',
      'Weet je zeker dat je deze afspraak wilt verwijderen?',
      [
        { text: 'Nee', style: 'cancel' },
        {
          text: 'Ja',
          style: 'destructive',
          onPress: () => {
            deleteAppointments([selectedAppointment.id]);
            setShowEditModal(false);
            setSelectedAppointment(null);
          },
        },
      ]
    );
  };

  const today = formatDateToLocal(new Date());

  const getDatePickerDays = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    
    const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: formatDateToLocal(prevMonthDay),
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: formatDateToLocal(fullDate),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: formatDateToLocal(nextMonthDay),
      });
    }
    
    return days;
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="calendar-screen">
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.25, 1]}
        />
        
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
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
              const hasPerformance = performanceDates.has(day.fullDate);
              const hasPractice = practiceDates.has(day.fullDate);
              const hasExtraTraining = extraTrainingDates.has(day.fullDate);
              const hasBirthday = birthdayDates.has(day.fullDate);
              
              return (
                <View key={`${day.fullDate}-${index}`} style={styles.dayCell}>
                  <View style={[
                    styles.dayNumber,
                    !day.isCurrentMonth && styles.dayNumberInactive,
                    isToday && styles.dayNumberToday,
                    hasPerformance && day.isCurrentMonth && styles.dayNumberPerformance,
                    hasAppointments && day.isCurrentMonth && styles.dayNumberAppointment,
                    hasBirthday && day.isCurrentMonth && !hasPerformance && !hasAppointments && styles.dayNumberBirthday,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.dayTextInactive,
                      isToday && styles.dayTextToday,
                    ]}>
                      {day.date}
                    </Text>
                    {hasPractice && day.isCurrentMonth && !hasPerformance && !hasAppointments && !hasExtraTraining && !hasBirthday && (
                      <View style={styles.practiceDot} />
                    )}
                    {hasExtraTraining && day.isCurrentMonth && (
                      <View style={styles.extraTrainingDot} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotBlue} />
              <Text style={styles.legendText}>Training</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotRed} />
              <Text style={styles.legendText}>Extra Training</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendCirclePurple} />
              <Text style={styles.legendText}>Optreden</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendCircleOrange} />
              <Text style={styles.legendText}>Verjaardag</Text>
            </View>
          </View>
          </View>

          <View style={styles.appointmentsHeader}>
            <Text style={styles.appointmentsTitle}>{MONTHS[currentDate.getMonth()]} Afspraken</Text>
            <Text style={styles.appointmentsCount}>{currentMonthAppointments.length}</Text>
          </View>

          <View style={styles.list}>
            {currentMonthAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <CalendarIcon color={Colors.light.muted} size={48} strokeWidth={1.5} />
                <Text style={styles.emptyText}>Nog geen afspraken deze maand</Text>
              </View>
            ) : (
              currentMonthAppointments.map((item) => {
                const dateObj = parseDateString(item.date);
                const formattedDate = `${dateObj.getDate()} ${MONTHS[dateObj.getMonth()].slice(0, 3)} ${dateObj.getFullYear()}`;
                const creator = users.find(u => u.id === item.createdBy);
                const isCancelled = item.status === 'cancelled';
                const isAdmin = currentUser?.role === 'admin';
                const isCreator = currentUser?.id === item.createdBy;
                const canEdit = isAdmin || isCreator;
                
                return (
                  <Pressable 
                    key={item.id} 
                    style={[styles.card, isCancelled && styles.cardCancelled]} 
                    onPress={() => canEdit && openEditModal(item)}
                    disabled={!canEdit}
                  >
                    <View style={[styles.cardColorStrip, isCancelled && styles.cardColorStripCancelled]} />
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, isCancelled && styles.cardTitleCancelled]}>{item.name}</Text>
                        <View style={[styles.categoryBadge, isCancelled && styles.categoryBadgeCancelled]}>
                          <Text style={[styles.categoryText, isCancelled && styles.categoryTextCancelled]}>{item.category}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <CalendarIcon color={isCancelled ? Colors.light.darkGray : Colors.light.muted} size={14} strokeWidth={2} />
                          <Text style={[styles.metaText, isCancelled && styles.metaTextCancelled]}>{formattedDate}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={[styles.metaText, isCancelled && styles.metaTextCancelled]}>{item.time}</Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <MapPin color={isCancelled ? Colors.light.darkGray : Colors.light.muted} size={14} strokeWidth={2} />
                          <Text style={[styles.metaText, isCancelled && styles.metaTextCancelled]}>{item.location}</Text>
                        </View>
                      </View>

                      {item.memberIds.length > 0 && (
                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Users color={isCancelled ? Colors.light.darkGray : Colors.light.muted} size={14} strokeWidth={2} />
                            <Text style={[styles.metaText, isCancelled && styles.metaTextCancelled]}>{item.memberIds.length} leden</Text>
                          </View>
                        </View>
                      )}
                      
                      {creator && (
                        <Text style={[styles.creatorText, isCancelled && styles.creatorTextCancelled]}>Toegevoegd door {creator.username}</Text>
                      )}
                    </View>
                    {isCancelled && (
                      <View style={styles.cancelledBadge}>
                        <Text style={styles.cancelledBadgeText}>Geannuleerd</Text>
                      </View>
                    )}
                    {!item.confirmed && !isCancelled && (
                      <View style={styles.notConfirmedBadge}>
                        <Text style={styles.notConfirmedBadgeText}>Niet bevestigd</Text>
                      </View>
                    )}
                    {item.confirmed && !isCancelled && (
                      <View style={styles.confirmedBadge}>
                        <Text style={styles.confirmedBadgeText}>Bevestigd</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>

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
                  onPress={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowHourPicker(false);
                    setShowMinutePicker(false);
                    if (!showDatePicker) {
                      setPickerMonth(parseDateString(formData.date));
                    }
                  }}
                  testID="date-picker-button"
                >
                  <Text style={styles.dropdownText}>
                    {parseDateString(formData.date).toLocaleDateString('nl-NL', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <CalendarIcon color={Colors.light.muted} size={20} />
                </Pressable>
                {showDatePicker && (
                  <View style={styles.calendarPickerContainer}>
                    <View style={styles.calendarPickerHeader}>
                      <TouchableOpacity 
                        onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                        style={styles.calendarPickerButton}
                      >
                        <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.calendarPickerMonth}>
                        {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                        style={styles.calendarPickerButton}
                      >
                        <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calendarPickerWeekDays}>
                      {DAYS.map((day) => (
                        <Text key={day} style={styles.calendarPickerWeekDay}>{day}</Text>
                      ))}
                    </View>
                    <View style={styles.calendarPickerGrid}>
                      {getDatePickerDays(pickerMonth).map((day, index) => (
                        <TouchableOpacity
                          key={`${day.fullDate}-${index}`}
                          style={styles.calendarPickerDay}
                          onPress={() => {
                            if (day.isCurrentMonth) {
                              setFormData({ ...formData, date: day.fullDate });
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={!day.isCurrentMonth}
                        >
                          <View style={[
                            styles.calendarPickerDayCircle,
                            !day.isCurrentMonth && styles.calendarPickerDayInactive,
                            formData.date === day.fullDate && styles.calendarPickerDaySelected,
                          ]}>
                            <Text style={[
                              styles.calendarPickerDayText,
                              !day.isCurrentMonth && styles.calendarPickerDayTextInactive,
                              formData.date === day.fullDate && styles.calendarPickerDayTextSelected,
                            ]}>
                              {day.date}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tijd</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowHourPicker(!showHourPicker);
                    setShowMinutePicker(false);
                    setShowDatePicker(false);
                  }}
                  testID="time-picker-button"
                >
                  <Text style={styles.dropdownText}>{formData.time}</Text>
                  <ChevronRight 
                    color={Colors.light.muted} 
                    size={20} 
                    style={{ transform: [{ rotate: showHourPicker ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {showHourPicker && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerContent}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerColumnLabel}>Uur</Text>
                        <ScrollView 
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = String(i).padStart(2, '0');
                            const isSelected = formData.time.split(':')[0] === hour;
                            return (
                              <TouchableOpacity
                                key={hour}
                                style={[
                                  styles.timePickerItem,
                                  isSelected && styles.timePickerItemSelected
                                ]}
                                onPress={() => {
                                  const currentMinute = formData.time.split(':')[1];
                                  setFormData({ ...formData, time: `${hour}:${currentMinute}` });
                                }}
                              >
                                <Text style={[
                                  styles.timePickerItemText,
                                  isSelected && styles.timePickerItemTextSelected
                                ]}>
                                  {hour}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                      <Text style={styles.timePickerColon}>:</Text>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerColumnLabel}>Min</Text>
                        <ScrollView 
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const minute = String(i * 5).padStart(2, '0');
                            const isSelected = formData.time.split(':')[1] === minute;
                            return (
                              <TouchableOpacity
                                key={minute}
                                style={[
                                  styles.timePickerItem,
                                  isSelected && styles.timePickerItemSelected
                                ]}
                                onPress={() => {
                                  const currentHour = formData.time.split(':')[0];
                                  setFormData({ ...formData, time: `${currentHour}:${minute}` });
                                }}
                              >
                                <Text style={[
                                  styles.timePickerItemText,
                                  isSelected && styles.timePickerItemTextSelected
                                ]}>
                                  {minute}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.timePickerDoneButton}
                      onPress={() => setShowHourPicker(false)}
                    >
                      <Text style={styles.timePickerDoneButtonText}>Klaar</Text>
                    </TouchableOpacity>
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
                <Text style={styles.inputLabel}>Voor wie</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowForUserDropdown(!showForUserDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.forUserId ? users.find(u => u.id === formData.forUserId)?.username || 'Selecteer lid' : 'Selecteer lid'}
                  </Text>
                  <ChevronRight 
                    color={Colors.light.muted} 
                    size={20} 
                    style={{ transform: [{ rotate: showForUserDropdown ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {showForUserDropdown && (
                  <ScrollView
                    style={styles.memberScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, forUserId: undefined });
                        setShowForUserDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        !formData.forUserId && styles.dropdownItemTextActive
                      ]}>
                        Niemand
                      </Text>
                    </TouchableOpacity>
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, forUserId: user.id });
                          setShowForUserDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          formData.forUserId === user.id && styles.dropdownItemTextActive
                        ]}>
                          {user.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => setFormData({ ...formData, confirmed: !formData.confirmed })}
                >
                  <View style={[
                    styles.checkbox,
                    formData.confirmed && styles.checkboxChecked
                  ]}>
                    {formData.confirmed && <Check color={Colors.light.text} size={16} strokeWidth={3} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Bevestigd</Text>
                </Pressable>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      category: 'Feestje',
                      date: formatDateToLocal(new Date()),
                      time: '12:00',
                      location: '',
                      memberIds: [],
                      forUserId: undefined,
                      confirmed: false,
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

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Afspraak Bewerken</Text>
                <Pressable onPress={() => setShowEditModal(false)}>
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Naam</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  placeholder="Naam van de afspraak"
                  placeholderTextColor={Colors.light.muted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categorie</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={styles.dropdownText}>{editFormData.category}</Text>
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
                          setEditFormData({ ...editFormData, category });
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          editFormData.category === category && styles.dropdownItemTextActive
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
                  onPress={() => {
                    setShowEditDatePicker(!showEditDatePicker);
                    setShowHourPicker(false);
                    setShowMinutePicker(false);
                    if (!showEditDatePicker) {
                      setEditPickerMonth(parseDateString(editFormData.date));
                    }
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {parseDateString(editFormData.date).toLocaleDateString('nl-NL', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <CalendarIcon color={Colors.light.muted} size={20} />
                </Pressable>
                {showEditDatePicker && (
                  <View style={styles.calendarPickerContainer}>
                    <View style={styles.calendarPickerHeader}>
                      <TouchableOpacity 
                        onPress={() => setEditPickerMonth(new Date(editPickerMonth.getFullYear(), editPickerMonth.getMonth() - 1, 1))}
                        style={styles.calendarPickerButton}
                      >
                        <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.calendarPickerMonth}>
                        {MONTHS[editPickerMonth.getMonth()]} {editPickerMonth.getFullYear()}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => setEditPickerMonth(new Date(editPickerMonth.getFullYear(), editPickerMonth.getMonth() + 1, 1))}
                        style={styles.calendarPickerButton}
                      >
                        <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calendarPickerWeekDays}>
                      {DAYS.map((day) => (
                        <Text key={day} style={styles.calendarPickerWeekDay}>{day}</Text>
                      ))}
                    </View>
                    <View style={styles.calendarPickerGrid}>
                      {getDatePickerDays(editPickerMonth).map((day, index) => (
                        <TouchableOpacity
                          key={`${day.fullDate}-${index}`}
                          style={styles.calendarPickerDay}
                          onPress={() => {
                            if (day.isCurrentMonth) {
                              setEditFormData({ ...editFormData, date: day.fullDate });
                              setShowEditDatePicker(false);
                            }
                          }}
                          disabled={!day.isCurrentMonth}
                        >
                          <View style={[
                            styles.calendarPickerDayCircle,
                            !day.isCurrentMonth && styles.calendarPickerDayInactive,
                            editFormData.date === day.fullDate && styles.calendarPickerDaySelected,
                          ]}>
                            <Text style={[
                              styles.calendarPickerDayText,
                              !day.isCurrentMonth && styles.calendarPickerDayTextInactive,
                              editFormData.date === day.fullDate && styles.calendarPickerDayTextSelected,
                            ]}>
                              {day.date}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tijd</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowMinutePicker(!showMinutePicker);
                    setShowHourPicker(false);
                    setShowEditDatePicker(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{editFormData.time}</Text>
                  <ChevronRight 
                    color={Colors.light.muted} 
                    size={20} 
                    style={{ transform: [{ rotate: showMinutePicker ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {showMinutePicker && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerContent}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerColumnLabel}>Uur</Text>
                        <ScrollView 
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = String(i).padStart(2, '0');
                            const isSelected = editFormData.time.split(':')[0] === hour;
                            return (
                              <TouchableOpacity
                                key={hour}
                                style={[
                                  styles.timePickerItem,
                                  isSelected && styles.timePickerItemSelected
                                ]}
                                onPress={() => {
                                  const currentMinute = editFormData.time.split(':')[1];
                                  setEditFormData({ ...editFormData, time: `${hour}:${currentMinute}` });
                                }}
                              >
                                <Text style={[
                                  styles.timePickerItemText,
                                  isSelected && styles.timePickerItemTextSelected
                                ]}>
                                  {hour}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                      <Text style={styles.timePickerColon}>:</Text>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerColumnLabel}>Min</Text>
                        <ScrollView 
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const minute = String(i * 5).padStart(2, '0');
                            const isSelected = editFormData.time.split(':')[1] === minute;
                            return (
                              <TouchableOpacity
                                key={minute}
                                style={[
                                  styles.timePickerItem,
                                  isSelected && styles.timePickerItemSelected
                                ]}
                                onPress={() => {
                                  const currentHour = editFormData.time.split(':')[0];
                                  setEditFormData({ ...editFormData, time: `${currentHour}:${minute}` });
                                }}
                              >
                                <Text style={[
                                  styles.timePickerItemText,
                                  isSelected && styles.timePickerItemTextSelected
                                ]}>
                                  {minute}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.timePickerDoneButton}
                      onPress={() => setShowMinutePicker(false)}
                    >
                      <Text style={styles.timePickerDoneButtonText}>Klaar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Locatie</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.location}
                  onChangeText={(text) => setEditFormData({ ...editFormData, location: text })}
                  placeholder="Locatie van de afspraak"
                  placeholderTextColor={Colors.light.muted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Voor wie</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowEditForUserDropdown(!showEditForUserDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {editFormData.forUserId ? users.find(u => u.id === editFormData.forUserId)?.username || 'Selecteer lid' : 'Selecteer lid'}
                  </Text>
                  <ChevronRight 
                    color={Colors.light.muted} 
                    size={20} 
                    style={{ transform: [{ rotate: showEditForUserDropdown ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {showEditForUserDropdown && (
                  <ScrollView
                    style={styles.memberScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setEditFormData({ ...editFormData, forUserId: undefined });
                        setShowEditForUserDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        !editFormData.forUserId && styles.dropdownItemTextActive
                      ]}>
                        Niemand
                      </Text>
                    </TouchableOpacity>
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditFormData({ ...editFormData, forUserId: user.id });
                          setShowEditForUserDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          editFormData.forUserId === user.id && styles.dropdownItemTextActive
                        ]}>
                          {user.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => setEditFormData({ ...editFormData, confirmed: !editFormData.confirmed })}
                >
                  <View style={[
                    styles.checkbox,
                    editFormData.confirmed && styles.checkboxChecked
                  ]}>
                    {editFormData.confirmed && <Check color={Colors.light.text} size={16} strokeWidth={3} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Bevestigd</Text>
                </Pressable>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButtonSecondary]}
                  onPress={handleCancelAppointment}
                >
                  <Text style={styles.cancelButtonSecondaryText}>Afspraak annuleren</Text>
                </Pressable>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={[
                    styles.actionButtonHalf, 
                    styles.createButton, 
                    (!editFormData.name.trim() || !editFormData.location.trim()) && styles.disabledButton
                  ]}
                  onPress={handleEditAppointment}
                  disabled={!editFormData.name.trim() || !editFormData.location.trim()}
                >
                  <LinearGradient
                    colors={(editFormData.name.trim() && editFormData.location.trim()) 
                      ? [Colors.light.primary, Colors.light.primaryDark] 
                      : [Colors.light.surfaceLight, Colors.light.surfaceLight]
                    }
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[
                      styles.createButtonText, 
                      (!editFormData.name.trim() || !editFormData.location.trim()) && styles.disabledButtonText
                    ]}>
                      Opslaan
                    </Text>
                  </LinearGradient>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButtonHalf, styles.deleteButton]}
                  onPress={handleDeleteAppointment}
                >
                  <Text style={styles.deleteButtonText}>Afspraak verwijderen</Text>
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
  scrollContent: {
    flexGrow: 1,
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
  dayNumberPerformance: {
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  practiceDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  extraTrainingDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DC2626',
  },
  dayNumberAppointment: {
    borderWidth: 2,
    borderColor: '#9333EA',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
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
    position: 'relative',
  },
  cardCancelled: {
    backgroundColor: Colors.light.darkGray,
    opacity: 0.8,
  },
  cardColorStrip: {
    width: 4,
    backgroundColor: Colors.light.primary,
  },
  cardColorStripCancelled: {
    backgroundColor: '#6B7280',
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
  cardTitleCancelled: {
    opacity: 0.6,
  },
  categoryBadge: {
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryBadgeCancelled: {
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  categoryText: {
    color: Colors.light.text,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryTextCancelled: {
    opacity: 0.6,
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
  metaTextCancelled: {
    opacity: 0.5,
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
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonHalf: {
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
  calendarPickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  calendarPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarPickerButton: {
    padding: 4,
  },
  calendarPickerMonth: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  calendarPickerWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarPickerWeekDay: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  calendarPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarPickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  calendarPickerDayCircle: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarPickerDayInactive: {
    opacity: 0.3,
  },
  calendarPickerDaySelected: {
    backgroundColor: Colors.light.primary,
  },
  calendarPickerDayText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  calendarPickerDayTextInactive: {
    color: Colors.light.muted,
  },
  calendarPickerDayTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timePickerScroll: {
    maxHeight: 180,
    width: '100%',
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: Colors.light.primary,
  },
  timePickerItemText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  timePickerItemTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerColon: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 32,
  },
  timePickerDoneButton: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerDoneButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  creatorText: {
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  creatorTextCancelled: {
    opacity: 0.5,
  },
  cancelledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    color: Colors.light.text,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cancelButtonSecondary: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelButtonSecondaryText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pickerScrollView: {
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceLight,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  legendDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  legendCirclePurple: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  legendCircleOrange: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  legendText: {
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  dayNumberBirthday: {
    borderWidth: 2,
    borderColor: '#F97316',
  },
  memberScrollView: {
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxLabel: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  notConfirmedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notConfirmedBadgeText: {
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '700' as const,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedBadgeText: {
    color: Colors.light.text,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
