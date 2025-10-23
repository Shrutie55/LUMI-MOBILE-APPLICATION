import axios, { AxiosResponse } from "axios";
import { Alert } from "react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;


type ReminderStatus = "pending" | "completed" | string;

interface ReminderBase {
  title: string;
  description: string;
  date: string | Date;
  time: string | Date;
  status: ReminderStatus;
  isUrgent: boolean;
  isImportant: boolean;
  userId: string;
}

interface Reminder extends ReminderBase {
  _id: string;
}

interface ReminderWithSetters extends ReminderBase {
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setDate: (value: Date) => void;
  setTime: (value: string) => void;
  setStatus: (value: string) => void;
  setIsUrgent: (value: boolean) => void;
  setIsImportant: (value: boolean) => void;
  setAddModalVisible: (visible: boolean) => void;
  onRefresh: () => void;
}


interface FetchReminderHelpers {
  setReminders: (reminders: Reminder[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

interface FetchRemindersParams extends FetchReminderHelpers {
  userId: string;
}

interface FetchPatientRemindersParams extends FetchReminderHelpers {
  CGId: string;
  PATId: string;
}

interface PostReminderParams extends ReminderWithSetters { }

interface PostPatientReminderParams extends ReminderWithSetters {
  CGId: string;
  PATId: string;
}

interface UpdateReminderParams extends ReminderBase {
  selectedReminder: { remId: string };
  onRefresh: () => void;
  handleEditModalClose: () => void;
}

interface UpdatePatientReminderParams extends ReminderBase {
  selectedReminder: { remId: string };
  CGId: string;
  PATId: string;
  onRefresh: () => void;
  handleEditModalClose: () => void;
}

interface DeleteRemindersParams {
  userId: string;
  remId: string;
  onRefresh: () => void;
}
interface DeletePatientReminderParams {
  CGId: string;
  PATId: string;
  remId: string;
  onRefresh: () => void;
}


export const sendTokenToBackend = async (userId: string, token: string) => {
  try {
    await axios.post(`${apiUrl}/v1/notifications/store-token`, {
      token,
      userId,
    });
  } catch (error: any) {
    console.error(error);
  }
};

export const fetchReminders = async ({
  userId,
  setReminders,
  setError,
  setLoading,
  setRefreshing,
}: FetchRemindersParams): Promise<void> => {
  try {
    const response = await axios.get(`${apiUrl}/v1/reminders/patient`, {
      params: { userId },
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.status === "success") {
      if (response.data.reminders.length > 0) {
        setReminders(response.data.reminders);
        setError(null);
      } else {
        setReminders([]);
        setError("No reminders for this user.");
      }
    } else {
      setError(response.data.message || "Unexpected response from server");
    }
  } catch (error: any) {
    if (error.response && error.response.status === 500) {
      setError("Internal server error: " + error.response.data.error);
    } else {
      setError("Error fetching reminders: " + error.message);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

export const postReminder = async ({
  title,
  description,
  date,
  time,
  status,
  isUrgent,
  isImportant,
  userId,
  setTitle,
  setDescription,
  setDate,
  setTime,
  setStatus,
  setIsUrgent,
  setIsImportant,
  setAddModalVisible,
  onRefresh,
}: PostReminderParams): Promise<any> => {
  try {
    if (!userId) {
      Alert.alert("Error", "Failed to retrieve user ID");
      return;
    }

    if (!title || !description || !date || !time) {
      Alert.alert("Error", "All fields must be filled out correctly");
      return;
    }

    let timeString;
    if (typeof time === "string" && time.includes(":")) {
      timeString = time;
    } else {
      timeString = new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    const reminderData = {
      title,
      description,
      date: formattedDate,
      time: timeString,
      status,
      isUrgent,
      isImportant,
      userId,
    };

    const response = await axios.post(
      `${apiUrl}/v1/reminders/patient`,
      reminderData,
    );

    setTitle("");
    setDescription("");
    setDate(new Date());
    setTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
    setStatus("pending");
    setIsUrgent(false);
    setIsImportant(false);
    Alert.alert("Success", response.data.message);
    onRefresh();
    setAddModalVisible(false);

    return response;
  } catch (error: any) {
    console.error("Error posting reminder: ", error.response.data.error);
    Alert.alert("Error", "Failed to save the reminder. Please try again");
  }
};

export const updateReminder = async ({
  selectedReminder,
  userId,
  title,
  description,
  time,
  date,
  status,
  isUrgent,
  isImportant,
  onRefresh,
  handleEditModalClose,
}: UpdateReminderParams): Promise<void> => {
  try {
    if (!selectedReminder) {
      Alert.alert("Error", "No reminder selected for update");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "Failed to retrieve user ID");
      return;
    }

    if (!title || !description || !date || !time) {
      Alert.alert("Error", "All fields must be filled out correctly");
      return;
    }

    let timeString;
    if (typeof time === "string" && time.includes(":")) {
      timeString = time;
    } else {
      timeString = new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const reminderData = {
      title,
      description,
      date: formattedDate,
      time: timeString,
      status,
      isUrgent,
      isImportant,
      userId,
    };

    const response = await axios.put(
      `${apiUrl}/v1/reminders/patient/${selectedReminder.remId}`,
      reminderData,
    );

    if (response.status === 200) {
      Alert.alert("Success", response.data.message);
      onRefresh();
      handleEditModalClose();
    } else {
      Alert.alert(
        "Error",
        response.data.message || "Failed to update the reminder",
      );
    }
  } catch (error: any) {
    console.error(
      "Error updating reminder: ",
      error.response?.data || error.message,
    );
    Alert.alert("Error", "Failed to update the reminder. Please try again.");
  }
};

export const deleteReminder = async ({ userId, remId, onRefresh }: DeleteRemindersParams): Promise<void> => {
  if (!remId) {
    Alert.alert("Error", "Reminder ID is required");
    return;
  }
  Alert.alert(
    "Confirm Deletion",
    "Are you sure you want to delete this reminder?",
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("Deletion cancelled"),
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const response = await axios.delete(
              `${apiUrl}/v1/reminders/patient/${userId}/${remId}`,
            );

            if (response.status === 200) {
              Alert.alert("Success", response.data.message);
              onRefresh();
            } else {
              Alert.alert(
                "Error",
                response.data.message || "Failed to delete the reminder",
              );
            }
          } catch (error: any) {
            if (error.response && error.response.status === 404) {
              Alert.alert("Error", "Reminder not found");
            } else {
              console.error(
                "Error deleting reminder",
                error.response.data.message,
              );
              Alert.alert(
                "Error",
                "Failed to delete the reminder. Please try again",
              );
            }
          }
        },
      },
    ],
    { cancelable: false },
  );
};

export const fetchPatientReminders = async ({
  CGId,
  PATId,
  setReminders,
  setError,
  setLoading,
  setRefreshing,
}: FetchPatientRemindersParams): Promise<void> => {
  try {
    const response = await axios.get(`${apiUrl}/v1/reminders/caregiver`, {
      params: { CGId, PATId },
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.status === "success") {
      if (response.data.reminders.length > 0) {
        setReminders(response.data.reminders);
        setError(null);
      } else {
        setReminders([]);
        setError("No reminders for this user.");
      }
    } else {
      setError(response.data.message || "Unexpected response from server");
    }
  } catch (error: any) {
    if (error.response && error.response.status === 500) {
      setError("Internal server error: " + error.response.data.error);
    } else {
      setError("Error fetching reminders: " + error.message);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

export const postPatientReminder = async ({
  title,
  description,
  date,
  time,
  status,
  isUrgent,
  isImportant,
  userId,
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
}: PostPatientReminderParams): Promise<void | AxiosResponse> => {
  try {
    if (!userId) {
      Alert.alert("Error", "Failed to retrieve user ID");
      return;
    }

    if (!title || !description || !date || !time) {
      Alert.alert("Error", "All fields must be filled out correctly");
      return;
    }

    let timeString;
    if (typeof time === "string" && time.includes(":")) {
      timeString = time;
    } else {
      timeString = new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    // Combine date and time into a single Date object
    const reminderTime = new Date(date);
    const [hours, minutes] = timeString.split(":");
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const reminderData = {
      title,
      description,
      date,
      status,
      time: timeString,
      isUrgent,
      isImportant,
      userId,
      PATId,
      CGId,
    };

    const response = await axios.post(
      `${apiUrl}/v1/reminders/caregiver`,
      reminderData,
    );
    setTitle("");
    setDescription("");
    setDate(new Date());
    setTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
    setStatus("pending");
    setIsUrgent(false);
    setIsImportant(false);
    Alert.alert("Success", response.data.message);
    onRefresh();
    setAddModalVisible(false);

    return response;
  } catch (error: any) {
    console.error("Error posting reminder", error.response.data.message);
    Alert.alert("Error", "Failed to save the reminder. Please try again");
  }
};

export const updatePatientReminder = async ({
  selectedReminder,
  userId,
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
}: UpdatePatientReminderParams): Promise<void> => {
  if (!selectedReminder) {
    Alert.alert("Error", "No reminder selected for update");
    return;
  }

  try {
    if (!userId) {
      Alert.alert("Error", "Failed to retrieve user ID");
      return;
    }

    if (!title || !description || !date || !time) {
      Alert.alert("Error", "All fields must be filled out correctly");
      return;
    }

    const timeString =
      typeof time === "string"
        ? time
        : time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

    const reminderTime = new Date(date);
    const [hours, minutes] = timeString.split(":");
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (isNaN(reminderTime.getTime())) {
      Alert.alert("Error", "Invalid date and time. Please check your inputs.");
      return;
    }
    const response = await axios.put(
      `${apiUrl}/v1/reminders/caregiver/${selectedReminder.remId}`,
      {
        title,
        description,
        date: date.toISOString(),
        time: timeString,
        status,
        isUrgent,
        isImportant,
        userId,
        CGId,
        PATId,
      },
    );

    if (response.status === 200) {
      Alert.alert("Success", response.data.message);
      onRefresh();
      handleEditModalClose();
    } else {
      Alert.alert(
        "Error",
        response.data.message || "Failed to update the reminder",
      );
    }
  } catch (error) {
    console.error("Error updating reminder", error);
    Alert.alert("Error", "Failed to update the reminder. Please try again");
  }
};

export const deletePatientReminder = async ({ CGId, PATId, remId, onRefresh }: DeletePatientReminderParams): Promise<void> => {
  if (!remId) {
    Alert.alert("Error", "Reminder ID is required");
    return;
  }
  Alert.alert(
    "Confirm Deletion",
    "Are you sure you want to delete this reminder?",
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("Deletion cancelled"),
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const response = await axios.delete(
              `${apiUrl}/v1/reminders/caregiver/${CGId}/${PATId}/${remId}`,
            );

            if (response.status === 200) {
              Alert.alert("Success", response.data.message);
              onRefresh();
            } else {
              Alert.alert(
                "Error",
                response.data.message || "Failed to delete the reminder",
              );
            }
          } catch (error: any) {
            if (error.response && error.response.status === 404) {
              Alert.alert("Error", "Reminder not found");
            } else {
              console.error(
                "Error deleting reminder",
                error.response.data.message,
              );
              Alert.alert(
                "Error",
                "Failed to delete the reminder. Please try again",
              );
            }
          }
        },
      },
    ],
    { cancelable: false },
  );
};
