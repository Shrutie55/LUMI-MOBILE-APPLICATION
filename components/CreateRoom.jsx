import React, { useState } from "react";
import { Modal, View, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Icon } from "@/constants/Icons";
import { useUser } from "@/hooks/useUser"
import { createRoom } from "../services/userService";
const CreateRoom = ({ isVisible, setIsVisible, toggleModal }) => {
  const { user, refetch } = useUser()
  const userId = user?.userId
  const familyId = user?.familyId
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing")
      return
    }
    setIsLoading(true)
    try {
      const response = await createRoom(familyId);
      Alert.alert("Success", `Room ID created ${response.room}`)
      setIsVisible(false)
      refetch()
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 justify-center items-center mt-6">
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={toggleModal}
      >
        <View className="flex-1 justify-center items-center mt-6">
          <View className="m-5 bg-white rounded-3xl p-20 items-center shadow-md shadow-black">
            <TouchableOpacity
              className="absolute top-3 right-5"
              onPress={toggleModal}
            >
              <Icon
                name="circle-with-cross"
                size={30}
                color="black"
                library="Entypo"
              />
            </TouchableOpacity>
            <Text className="text-lg font-bold mb-5">Create Room ID</Text>

            {isLoading ? (<ActivityIndicator size="large" color="blue" />) : (
              <TouchableOpacity
                className="bg-black rounded-xl p-3 mt-3"
                onPress={handleSubmit}
              >
                <Text className="text-white font-bold text-center">Generate a Room ID</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default CreateRoom;
