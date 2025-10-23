import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "@/constants/Icons";
import {
  fetchPatientReminders,
  postPatientReminder,
  updatePatientReminder,
  deletePatientReminder,
  sendTokenToBackend,
} from "@/services/remindersService";
import EditModalComponent from "@/components/EditModalComponent";
import AddModalComponent from "@/components/AddModalComponent";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech"
import { usePatient } from "@/hooks/usePatient"
import FadeWrapper from "@/components/FadeWrapper";

const CgReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [status, setStatus] = useState("pending");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { CGId, PATId } = usePatient()

  const fetchPatientData = async () => {
    if (CGId && PATId) {
      fetchPatientReminders({
        CGId,
        PATId,
        setReminders,
        setError,
        setLoading,
        setRefreshing
      });
    } else {
      setLoading(false);
    }
  };

  const postPatientReminders = async () => {
    const patientReminderData = {
      title,
      description,
      date,
      time,
      status,
      isUrgent,
      isImportant,
      userId: PATId,
      PATId,
      CGId,
      setTitle,
      setDescription,
      setDate,
      setTime,
      setStatus,
      setIsUrgent,
      setIsImportant,
      setAddModalVisible,
      onRefresh,
    };
    await postPatientReminder(patientReminderData);
  };
  const updatePatientReminders = async () => {
    const patientReminderData = {
      selectedReminder,
      userId: PATId,
      CGId,
      PATId,
      title,
      description,
      time,
      date,
      status,
      isUrgent,
      isImportant,
      onRefresh,
      handleEditModalClose,
    };
    await updatePatientReminder(patientReminderData);
  };

  const handleDeleteReminder = async (remId) => {
    await deletePatientReminder({ CGId, PATId, remId, onRefresh });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatientData();
    resetEditFields();
  }, []);

  const handleEditModalClose = () => {
    resetEditFields();
    setEditModalVisible(false);
  };

  const handleEdit = async (remId) => {
    const reminder = reminders.find((rem) => rem._id === remId);
    if (reminder) {
      setSelectedReminder(reminder);
      setTitle(reminder.title);
      setDescription(reminder.description);
      setDate(new Date(reminder.date));
      setTime(new Date(reminder.time));
      setStatus(reminder.status);
      setIsUrgent(reminder.urgent);
      setIsImportant(reminder.important);
      setEditModalVisible(true);
    } else {
      Alert.alert("Error", "Reminder not found");
    }
  };

  const resetEditFields = () => {
    setTitle("");
    setDescription("");
    setDate(new Date());
    setTime(new Date());
    setStatus("pending");
    setIsUrgent(null);
    setIsImportant(null);
    setSelectedReminder(null);
  };

  const getBackgroundColorClass = (urgent, important) => {
    if (urgent && important) {
      return "bg-custom-red";
    } else if (!urgent && important) {
      return "bg-custom-green";
    } else if (urgent && !important) {
      return "bg-custom-yellow";
    } else {
      return "bg-custom-white";
    }
  };

  const sortedReminders = reminders.slice().sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (a.status === "completed" && b.status === "pending") return 1;
    if (a.status === "pending" && b.status === "completed") return -1;
    return dateA - dateB;
  });


  async function registerForPushNotificationsAsync() {
    let token = null;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      throw new Error("Failed to get push token for push notification!");
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log(token);
    setExpoPushToken(token);

    await sendTokenToBackend(CGId, token);
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => token && setExpoPushToken(token)
    );
    const speak = (text) => {
      Speech.speak(text)
    }

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        const title = notification.request.content.title;
        setTimeout(() => {
          speak(title);
        }, 5000);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [])

  useEffect(() => {
    fetchPatientData();
  }, [CGId, PATId]);

  if (loading) {
    return <Text>Loading reminders...</Text>;
  }

  return (
    <>
      <FadeWrapper>
        <ScrollView
          className="bg-purple-100 rounded-lg"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="bg-purple-100 p-2 grid grid-cols-2 shadow-xl shadow-black h-full mt-0">
            {error ? (
              <Text className="col-span-2 text-2xl">{error}</Text>
            ) : (
              sortedReminders.map((reminder) => (
                <View
                  key={reminder._id}
                  className={`p-4 pb-2 rounded-3xl shadow-xl shadow-black mb-3 ${getBackgroundColorClass(
                    reminder.urgent,
                    reminder.important
                  )}`}
                >
                  <Text className="text-3xl ">
                    {reminder.title}
                  </Text>
                  <Text className="text-xl ">
                    {reminder.description}
                  </Text>

                  <View className="flex-1 flex-row items-center">
                    <Icon name="date" size={20} library="Fontisto" />
                    <Text className="text-xl ml-2 ">
                      {new Date(reminder.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center">
                    <Icon name="clockcircleo" size={20} library="AntDesign" />
                    <Text className="text-xl ml-2">{reminder.time}</Text>
                  </View>
                  <View className="flex-1 flex-row items-center">
                    {reminder.status === "pending" ?
                      <Icon name="pending" size={20} library="MaterialIcons" /> :
                      <Icon name="pending" size={20} library="MaterialIcons" color="white" />}
                    <Text className="text-xl ml-2">
                      {reminder.status === "pending" ? "Pending" : "Completed"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleEdit(reminder._id)}
                    className="absolute right-14 bottom-4"
                  >
                    <Icon
                      name="edit-note"
                      size={30}
                      color="black"
                      library="MaterialIcons"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteReminder(reminder.remId)}
                    className="absolute right-4 bottom-4"
                  >
                    <Icon
                      name="delete-outline"
                      size={30}
                      color="black"
                      library="MaterialIcons"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          <View className="mt-2">
            <AddModalComponent
              addModalVisible={addModalVisible}
              setAddModalVisible={setAddModalVisible}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              setStatus={setStatus}
              isUrgent={isUrgent}
              setIsUrgent={setIsUrgent}
              isImportant={isImportant}
              setIsImportant={setIsImportant}
              onSave={postPatientReminders}
            />

            <EditModalComponent
              editModalVisible={editModalVisible}
              setEditModalVisible={handleEditModalClose}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              status={status}
              setStatus={setStatus}
              isUrgent={isUrgent}
              setIsUrgent={setIsUrgent}
              isImportant={isImportant}
              setIsImportant={setIsImportant}
              onSave={updatePatientReminders}
            />
          </View>
        </ScrollView>
        <View className="justify-center items-center">
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            className="absolute bottom-24"
            activeOpacity={0.9}
          >
            <View className="bg-purple-600 w-full shadow-md shadow-black p-4 pl-20 pr-20 justify-center rounded-xl">
              <Text className="text-white font-bold text-xl">
                Add new task
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </FadeWrapper>
    </>
  );
};

export default CgReminders;
