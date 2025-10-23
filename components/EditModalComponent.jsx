import React, { useState, useEffect } from "react";
import {
  Modal,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import Checkbox from "expo-checkbox";
import { Icon } from "@/constants/Icons";

const EditModalComponent = ({
  editModalVisible,
  setEditModalVisible,
  title,
  setTitle,
  description,
  setDescription,
  date,
  setDate,
  time,
  setTime,
  status,
  setStatus,
  isUrgent,
  setIsUrgent,
  isImportant,
  setIsImportant,
  onSave,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(status);

  const [items, setItems] = useState([
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
  ]);

  useEffect(() => {
    setValue(status);
    setTitle(title);
    setDescription(description);
    setDate(date);
    setIsUrgent(isUrgent);
    setIsImportant(isImportant);
    if (typeof time === "string" && time.includes(":")) {
      const [hours, minutes] = time.split(":").map(Number);
      const dateForTime = new Date(date || Date.now());
      dateForTime.setHours(hours, minutes, 0, 0);
      setTime(dateForTime);
    } else if (time instanceof Date && !isNaN(time)) {
      setTime(time);
    } else {
      setTime(new Date());
    }
  }, [title, description, date, status, isUrgent, isImportant, time]);


  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate)
    }
    setShowDatePicker(false)
  };

  const onTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setTime(selectedTime)
    }
    setShowTimePicker(false)
  };

  const handleSave = () => {
    onSave({
      title,
      description,
      date,
      time,
      status: value,
      isUrgent,
      isImportant,
    });
    setEditModalVisible(false);
  };

  return (
    <View className="flex-1 justify-center items-center mt-6">
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center mt-6">
          <View className="m-5 bg-gray-50 rounded-xl p-20 items-center shadow-md shadow-black">
            <TouchableOpacity
              className="absolute top-3 right-6"
              onPress={() => setEditModalVisible(false)}
            >
              <Icon
                name="close"
                size={38}
                color="black"
                library="FontAwesome"
              />
            </TouchableOpacity>
            <Text className="text-xl font-bold mb-5">Edit Reminder</Text>
            <TextInput
              className="h-12 w-72 border border-gray-600 mb-4 px-3 rounded"
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              className="h-12 w-72 border border-gray-600 mb-4 px-3 rounded"
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <DropDownPicker
              className="h-12 w-72 border border-gray-600 mb-4 px-3 rounded"
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={(callback) => {
                const selectedValue = callback(value);
                setValue(selectedValue);
                setStatus(selectedValue);
              }}
              setItems={setItems}
            />
            <TouchableOpacity
              className="h-12 w-72 border border-gray-600 mb-4 px-3 rounded justify-center"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-gray-700">
                {date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "Pick a date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <TouchableOpacity
              className="h-12 w-72 border border-gray-600 mb-4 px-3 rounded justify-center"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-gray-700">
                {time instanceof Date && !isNaN(time)
                  ? time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  : "Pick a time"}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time instanceof Date && !isNaN(time) ? time : new Date()}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <View className="flex-row mb-4">
              <View className="flex-row w-30 p-2">
                <Checkbox
                  className="m-2 mr-1"
                  value={isUrgent}
                  onValueChange={setIsUrgent}
                />
                <Text className="m-2">Urgent</Text>
              </View>
              <View className="flex-row w-30 p-2">
                <Checkbox
                  className="m-2 mr-1"
                  value={isImportant}
                  onValueChange={setIsImportant}
                />
                <Text className="m-2">Important</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-green-500/80 rounded-xl p-3 mt-3"
              onPress={handleSave}
            >
              <Text className="text-white font-bold text-center">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditModalComponent;
