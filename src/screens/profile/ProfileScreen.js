import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList
} from 'react-native';
import Flag from 'react-native-flags';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDarkMode } from '../../context/DarkModeContext';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth';
import Button from '../../components/Button';
import CustomButton from '../../components/CustomButton';
import { styles } from '../../styles/styles';
import newStyle from '../../styles/style';
import { getProfilePictureUrlByUserId } from '../../services/getProfilePictureUrlByUserId';
import {
  fetchVisitedCountries,
  fetchWishListCountries,
  validateCountry,
  addVisitedCountry,
  removeVisitedCountry,
  addWishListCountry,
  removeWishListCountry,
} from '../../backend/Profile';
import friendService from '../../services/friendService';
import getUsernamesByUserIds from '../../services/getUsernamesByUserIds'
import { getUserStats } from '../../services/getUserStats';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';

export default function ProfileScreen() {
  const { isDarkMode } = useDarkMode();
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [wishListCountries, setWishListCountries] = useState([]);
  const [newVisited, setNewVisited] = useState('');
  const [newWishList, setNewWishList] = useState('');
  const [showVisitedInput, setShowVisitedInput] = useState(false);
  const [showWishListInput, setShowWishListInput] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [travelBuddiesModalVisible, setTravelBuddiesModalVisible] = useState(false);
  const [travelBuddies, setTravelBuddies] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const navigation = useNavigation();

  useEffect(() => {
    if (!user || !user.id) return; // Exit if user is not yet defined or has no id

    const fetchProfilePictureUrl = async () => {
      try {
        showLoading("Fetching Profile Picture");
        const url = await getProfilePictureUrlByUserId(user.id);
        setProfilePictureUrl(url);
      } catch (error) {
        console.error("Error fetching Profile Picture URL:", error);
      } finally {
        hideLoading();
      }
    };

    const fetchProfileData = async () => {
      try {
        showLoading("Fetching User Stats");
        const visitedCountriesData = await fetchVisitedCountries(user.id);
        setVisitedCountries(visitedCountriesData);

        const wishListCountriesData = await fetchWishListCountries(user.id);
        setWishListCountries(wishListCountriesData);

        // Fetch travel buddies
        const travelBuddiesData = await friendService.getFriends();
        const travelBuddiesIds = travelBuddiesData.map(buddy => buddy.friend_id);
        const travelBuddiesNames = await getUsernamesByUserIds(travelBuddiesIds);
        setTravelBuddies(travelBuddiesNames);

        // Fetch user stats
        const stats = await getUserStats(user.id, getFriendCount = false);
        setPostCount(stats.postCount);
        setUpvoteCount(stats.upvoteCount);
        setDownvoteCount(stats.downvoteCount);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        hideLoading();
      }
    };

    fetchProfilePictureUrl();
    fetchProfileData();
  }, [user]);

  const handleAddVisitedCountry = async () => {
    if (newVisited) {
      if (visitedCountries.some(country => country.name.toLowerCase() === newVisited.toLowerCase())) {
        alert('Das Land ist bereits in der Liste der besuchten Länder.');
        return;
      }

      const countryId = await validateCountry(newVisited);
      if (!countryId) {
        alert('Das eingegebene Land ist nicht in der Tabelle "Country" vorhanden.');
        return;
      }

      const updatedVisited = [...visitedCountries, { name: newVisited, verified: false }];
      setVisitedCountries(updatedVisited);
      setNewVisited('');

      try {
        await addVisitedCountry(user.id, countryId);
      } catch (error) {
        console.error('Error adding visited country:', error);
      }
    }
    setShowVisitedInput(false);
  };

  const handleAddWishListCountry = async () => {
    if (newWishList) {
      if (wishListCountries.some(country => country.toLowerCase() === newWishList.toLowerCase())) {
        alert('Das Land ist bereits in der Wunschliste.');
        return;
      }

      const countryId = await validateCountry(newWishList);
      if (!countryId) {
        alert('Das eingegebene Land ist nicht in der Tabelle "Country" vorhanden.');
        return;
      }

      const updatedWishList = [...wishListCountries, newWishList];
      setWishListCountries(updatedWishList);
      setNewWishList('');

      try {
        await addWishListCountry(user.id, updatedWishList);
      } catch (error) {
        console.error('Error updating wishlist countries:', error);
      }
    }
    setShowWishListInput(false);
  };

  const handleRemoveVisitedCountry = async (index) => {
    const countryToRemove = visitedCountries[index];
    const updatedCountries = [...visitedCountries];
    updatedCountries.splice(index, 1);
    setVisitedCountries(updatedCountries);

    try {
      const countryData = await validateCountry(countryToRemove.name);
      await removeVisitedCountry(user.id, countryData);
    } catch (error) {
      console.error('Error deleting visited country:', error);
    }
  };

  const handleRemoveWishListCountry = async (index) => {
    const updatedCountries = [...wishListCountries];
    updatedCountries.splice(index, 1);
    setWishListCountries(updatedCountries);

    try {
      if (updatedCountries.length === 0) {
        await removeWishListCountry(user.id);
      } else {
        await addWishListCountry(user.id, updatedCountries);
      }
    } catch (error) {
      console.error('Error updating wishlist countries:', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      // Close the keyboard when the user taps outside of the input fields
      Keyboard.dismiss();
      setShowVisitedInput(false);
      setShowWishListInput(false);
    }}>
      <ScrollView style={[newStyle.container, { backgroundColor: isDarkMode ? '#070A0F' : '#FFF' }]}>
        <View style={[newStyle.centeredContainer, { backgroundColor: isDarkMode ? '#070A0F' : '#FFF' }]}>
          <Image
            source={{ uri: profilePictureUrl }}
            style={newStyle.largeProfileImage}
          />
          <Text style={[newStyle.titleText, { color: isDarkMode ? '#FFFDF3' : '#000000' }]}>{user.user_metadata.username}</Text>
          <Text style={[newStyle.bodyText, { color: isDarkMode ? '#FFFDF3' : '#000000' }]}>{user.email}</Text>

          {/* Birthday */}
          <View style={newStyle.row}>
            <Icon name="birthday-cake" size={14} style={[newStyle.marginRightExtraSmall, { color: isDarkMode ? '#FFFDF3' : '#000000' }]} />
            <Text style={[newStyle.bodyText, { color: isDarkMode ? '#FFFDF3' : '#000000' }]}>
              {user.user_metadata.birthday ? user.user_metadata.birthday : 'No birthdate configured'}
            </Text>
          </View>

          {/* Flag */}
          <View style={newStyle.row}>
            <Flag code="DE" size={16} style={newStyle.marginRightExtraSmall} />
            <Text style={[newStyle.bodyText, { color: isDarkMode ? '#FFFDF3' : '#000000' }]}>Deutschland</Text>
          </View>
        </View>

        {/* User Stats Section */}
        <View style={newStyle.userStatsContainer}>
          {/* Row 1: Friends and Posts */}
          <View style={newStyle.userStatsRow}>
            <View style={newStyle.userStatColumn}>
              <TouchableOpacity onPress={() => setTravelBuddiesModalVisible(true)} style={[{ justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={newStyle.userStatLabel}>Travel-Buddies</Text>
                <Text style={newStyle.userStatValue}>{travelBuddies.length != null ? travelBuddies.length : 'N/A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={newStyle.userStatColumn}>
              <Text style={newStyle.userStatLabel}>Posts</Text>
              <Text style={newStyle.userStatValue}>{postCount != null ? postCount : 'N/A'}</Text>
            </View>
          </View>

          {/* Row 2: Upvotes and Downvotes */}
          <View style={newStyle.userStatsRow}>
            <View style={newStyle.userStatColumn}>
              <Text style={newStyle.userStatLabel}>Upvotes</Text>
              <Text style={newStyle.userStatValue}>{upvoteCount != null ? upvoteCount : 'N/A'}</Text>
            </View>
            <View style={newStyle.userStatColumn}>
              <Text style={newStyle.userStatLabel}>Downvotes</Text>
              <Text style={newStyle.userStatValue}>{downvoteCount != null ? downvoteCount : 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.header}>Bereits besuchte Länder:</Text>
          {visitedCountries.length === 0 ? (
            <Text style={styles.details}>Keine besuchten Länder hinzugefügt</Text>
          ) : (
            visitedCountries.map((country, index) => (
              <View key={index} style={styles.countryItem}>
                <View style={styles.countryTextContainer}>
                  <Text style={styles.details}>{country.name}</Text>
                  {country.verified && <Icon name="check-circle" size={16} color="green" style={styles.verifiedIcon} />}
                </View>
                <TouchableOpacity onPress={() => handleRemoveVisitedCountry(index)} style={styles.removeButton}>
                  <Icon name="trash" size={20} color="#FFFDF3" />
                </TouchableOpacity>
              </View>
            ))
          )}
          {showVisitedInput && (
            <>
              <TextInput
                style={styles.input}
                onChangeText={setNewVisited}
                value={newVisited}
                placeholder="Neues Ziel hinzufügen"
                placeholderTextColor="#cccccc"
              />
              <Button onPress={handleAddVisitedCountry} color="#58CFEC">Hinzufügen</Button>
            </>
          )}
          {!showVisitedInput && (
            <TouchableOpacity onPress={() => setShowVisitedInput(true)} style={styles.addButton}>
              <Icon name="plus" size={20} color="#FFFDF3" />
              <Text style={styles.addButtonText}> Besuchtes Land hinzufügen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.header}>Wunschreiseziele:</Text>
          {wishListCountries.length === 0 ? (
            <Text style={styles.details}>Keine Wunschziele hinzugefügt</Text>
          ) : (
            wishListCountries.map((country, index) => (
              <View key={index} style={styles.countryItem}>
                <Text style={styles.details}>{country}</Text>
                <TouchableOpacity onPress={() => handleRemoveWishListCountry(index)} style={styles.removeButton}>
                  <Icon name="trash" size={20} color="#FFFDF3" />
                </TouchableOpacity>
              </View>
            ))
          )}
          {showWishListInput && (
            <>
              <TextInput
                style={styles.input}
                onChangeText={setNewWishList}
                value={newWishList}
                placeholder="Neues Wunschland hinzufügen"
                placeholderTextColor="#cccccc"
              />
              <Button onPress={handleAddWishListCountry} color="#58CFEC">Hinzufügen</Button>
            </>
          )}
          {!showWishListInput && (
            <TouchableOpacity onPress={() => setShowWishListInput(true)} style={styles.addButton}>
              <Icon name="plus" size={20} color="#FFFDF3" />
              <Text style={styles.addButtonText}> Wunschland hinzufügen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: isDarkMode ? '#070A0F' : '#FFF' }]}>
          <CustomButton
            title={"Zu den Einstellungen"}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {/* Travel Buddies Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={travelBuddiesModalVisible}
          onRequestClose={() => setTravelBuddiesModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setTravelBuddiesModalVisible(false)}>
            <View style={newStyle.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={newStyle.modalContent}>
                  {/* Close Button (X) */}
                  <TouchableOpacity style={newStyle.closeButtonX} onPress={() => setTravelBuddiesModalVisible(false)}>
                    <Text style={newStyle.closeButtonX}>✖</Text>
                  </TouchableOpacity>

                  {/* Travel Buddies listed */}
                  <Text style={newStyle.modalTitleText}>Travel Buddies</Text>
                  {travelBuddies.length === 0 ? (
                    <Text style={newStyle.bodyText}>You have no travel buddies yet.</Text>
                  ) : (
                    <FlatList
                      data={travelBuddies}
                      keyExtractor={(item) => item.user_id}
                      renderItem={({ item }) => (
                        <View>
                          <Text style={newStyle.bodyText}>{item.username}</Text>
                        </View>
                      )}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}