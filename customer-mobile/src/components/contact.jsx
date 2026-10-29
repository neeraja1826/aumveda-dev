import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

/* ============================================================
   WEBSITE IMAGES
============================================================ */

const CONTACT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1500&q=85";

const CONTACT_NATURE_IMAGE =
  "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1200&q=85";

const EMAIL = "aumvedawellness@gmail.com";
const MAIN_PHONE = "+919000006000";

/* ============================================================
   CONTACT PAGE
============================================================ */

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  /* ==========================================================
     OPEN EMAIL
  ========================================================== */

  const openEmail = async () => {
    try {
      await Linking.openURL(`mailto:${EMAIL}`);
    } catch (error) {
      Alert.alert(
        "Unable to open email",
        "Please email us at aumvedawellness@gmail.com"
      );
    }
  };

  /* ==========================================================
     OPEN PHONE
  ========================================================== */

  const openPhone = async (phone) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert(
        "Unable to make call",
        "Please use your phone application to call us."
      );
    }
  };

  /* ==========================================================
     FORM
  ========================================================== */

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("Required", "Please enter your email.");
      return;
    }

    if (!formData.message.trim()) {
      Alert.alert("Required", "Please enter your message.");
      return;
    }

    const subject =
      formData.subject.trim() || "AUMVEDA Website Enquiry";

    const body = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

Message:
${formData.message}
    `.trim();

    const mailto =
      `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailto);

      setSubmitted(true);

      Alert.alert(
        "Thank you",
        "Your email application has been opened."
      );
    } catch (error) {
      Alert.alert(
        "Unable to open email",
        `Please email us directly at ${EMAIL}`
      );
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "bottom"]}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* =====================================================
          HERO
      ===================================================== */}

      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroContent}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>
              LET'S CONNECT
            </Text>

            <Text style={styles.heroTitle}>
              Good wellness
            </Text>

            <Text style={styles.heroTitleAccent}>
              begins with a conversation.
            </Text>

            <Text style={styles.heroDescription}>
              Have a question about AUMVEDA, our products,
              partnerships or the journey we are building?
            </Text>

            <Text style={styles.heroDescription}>
              We would love to hear from you.
            </Text>

            {/* Hero Actions */}

            <View style={styles.heroActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  // Scroll to form section
                  // User can continue scrolling naturally.
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Send an Enquiry
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                style={styles.textButton}
                onPress={openEmail}
              >
                <Text style={styles.textButtonText}>
                  Email AUMVEDA
                </Text>

                <Ionicons
                  name="mail-outline"
                  size={15}
                  color="#DDE8DE"
                />
              </Pressable>
            </View>
          </View>

          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <View style={styles.heroVisual}>
            <View style={styles.orbitOne} />
            <View style={styles.orbitTwo} />

            {/* Top floating chip */}

            <View style={styles.heroChipTop}>
              <View style={styles.heroChipIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={15}
                  color="#DDE8DE"
                />
              </View>

              <Text style={styles.heroChipText}>
                Thoughtful wellness
              </Text>
            </View>

            {/* Letter card */}

            <View style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <View style={styles.logoMark}>
                  <Text style={styles.logoMarkText}>
                    A
                  </Text>
                </View>

                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>
                    AUMVEDA
                  </Text>

                  <Text style={styles.logoSubText}>
                    WELLNESS
                  </Text>
                </View>

                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#D7E2D9"
                />
              </View>

              {/* Decorative message lines */}

              <View style={styles.letterLines}>
                <View style={styles.letterLine} />
                <View style={styles.letterLine} />
                <View
                  style={[
                    styles.letterLine,
                    styles.shortLetterLine,
                  ]}
                />
              </View>

              {/* Message */}

              <View style={styles.messageBox}>
                <View style={styles.messageIcon}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#DDE8DE"
                  />
                </View>

                <View style={styles.messageContent}>
                  <Text style={styles.messageTitle}>
                    We're listening.
                  </Text>

                  <Text style={styles.messageSubtitle}>
                    Let's create a more conscious
                    wellness journey.
                  </Text>
                </View>
              </View>

              <View style={styles.letterFooter}>
                <Text style={styles.letterFooterText}>
                  ROOTED IN NATURE
                </Text>

                <Text style={styles.letterFooterText}>
                  REFINED BY AYURVEDA
                </Text>
              </View>
            </View>

            {/* Bottom chip */}

            <View style={styles.heroChipBottom}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#244938"
              />

              <Text style={styles.heroChipBottomText}>
                Hyderabad, India
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================
          REACH US
      ===================================================== */}

      <View style={styles.channelsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.darkEyebrow}>
            REACH US
          </Text>

          <Text style={styles.sectionTitle}>
            Choose the way
          </Text>

          <Text style={styles.sectionTitleAccent}>
            that feels right.
          </Text>
        </View>

        {/* Email */}

        <Pressable
          style={styles.channelCard}
          onPress={openEmail}
        >
          <View style={styles.channelIcon}>
            <Ionicons
              name="mail-outline"
              size={21}
              color="#315D48"
            />
          </View>

          <Text style={styles.channelLabel}>
            EMAIL
          </Text>

          <Text style={styles.channelTitle}>
            aumvedawellness@gmail.com
          </Text>

          <Text style={styles.channelDescription}>
            For general enquiries, partnerships and support.
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#5B695E"
            style={styles.channelArrow}
          />
        </Pressable>

        {/* Phone */}

        <Pressable
          style={styles.channelCard}
          onPress={() => openPhone(MAIN_PHONE)}
        >
          <View style={styles.channelIcon}>
            <Ionicons
              name="call-outline"
              size={21}
              color="#315D48"
            />
          </View>

          <Text style={styles.channelLabel}>
            CALL
          </Text>

          <Text style={styles.channelTitle}>
            +91 90000 06000
          </Text>

          <Text style={styles.channelDescription}>
            Speak directly with the AUMVEDA team.
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#5B695E"
            style={styles.channelArrow}
          />
        </Pressable>

        {/* Visit */}

        <View style={styles.channelCard}>
          <View style={styles.channelIcon}>
            <Ionicons
              name="location-outline"
              size={21}
              color="#315D48"
            />
          </View>

          <Text style={styles.channelLabel}>
            VISIT
          </Text>

          <Text style={styles.channelTitle}>
            Hyderabad
          </Text>

          <Text style={styles.channelDescription}>
            North Kamala Nagar,
            {"\n"}
            Hyderabad – 500062.
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#5B695E"
            style={styles.channelArrow}
          />
        </View>
      </View>

      {/* =====================================================
          SEND MESSAGE
      ===================================================== */}

      <View style={styles.formSection}>
        {/* Image */}

        <View style={styles.formImageContainer}>
          <Image
            source={{
              uri: CONTACT_HERO_IMAGE,
            }}
            style={styles.formImage}
            resizeMode="cover"
          />

          <View style={styles.formImageOverlay} />

          {/* Quote */}

          <View style={styles.quoteContainer}>
            <Text style={styles.quoteMark}>
              “
            </Text>

            <Text style={styles.quoteText}>
              Rooted in tradition,
              {"\n"}
              refined for modern living.
            </Text>

            <Text style={styles.quoteBrand}>
              AUMVEDA WELLNESS
            </Text>
          </View>

          {/* Small support card */}

          <View style={styles.supportCard}>
            <View style={styles.supportIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#315D48"
              />
            </View>

            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>
                Thoughtful support
              </Text>

              <Text style={styles.supportSubtitle}>
                Every enquiry matters.
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}

        <View style={styles.formContainer}>
          <Text style={styles.darkEyebrow}>
            SEND A MESSAGE
          </Text>

          <Text style={styles.formTitle}>
            Tell us
          </Text>

          <Text style={styles.formTitleAccent}>
            what you need.
          </Text>

          <Text style={styles.formIntro}>
            Whether you are exploring a product,
            looking for a partnership, or simply
            want to know more about AUMVEDA,
            send us a message.
          </Text>

          {/* Name */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              NAME
            </Text>

            <TextInput
              value={formData.name}
              onChangeText={(value) =>
                handleChange("name", value)
              }
              placeholder="Your name"
              placeholderTextColor="#A4A59D"
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              EMAIL
            </Text>

            <TextInput
              value={formData.email}
              onChangeText={(value) =>
                handleChange("email", value)
              }
              placeholder="you@example.com"
              placeholderTextColor="#A4A59D"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              PHONE
            </Text>

            <TextInput
              value={formData.phone}
              onChangeText={(value) =>
                handleChange("phone", value)
              }
              placeholder="+91"
              placeholderTextColor="#A4A59D"
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          {/* Subject */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              SUBJECT
            </Text>

            <TextInput
              value={formData.subject}
              onChangeText={(value) =>
                handleChange("subject", value)
              }
              placeholder="How can we help?"
              placeholderTextColor="#A4A59D"
              style={styles.input}
            />
          </View>

          {/* Message */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              MESSAGE
            </Text>

            <TextInput
              value={formData.message}
              onChangeText={(value) =>
                handleChange("message", value)
              }
              placeholder="Write your message here..."
              placeholderTextColor="#A4A59D"
              style={[
                styles.input,
                styles.messageInput,
              ]}
              multiline
              textAlignVertical="top"
              numberOfLines={6}
            />
          </View>

          {/* Submit */}

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Send Message
            </Text>

            <Ionicons
              name="paper-plane-outline"
              size={16}
              color="#FFFFFF"
            />
          </Pressable>

          {submitted && (
            <View style={styles.successMessage}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color="#315D48"
              />

              <Text style={styles.successText}>
                Your email app should open shortly.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* =====================================================
          DIRECT CONTACT
      ===================================================== */}

      <View style={styles.teamSection}>
        <View style={styles.teamHeader}>
          <Text style={styles.darkEyebrow}>
            DIRECT CONTACT
          </Text>

          <Text style={styles.teamTitle}>
            Connect with
          </Text>

          <Text style={styles.teamTitleAccent}>
            our team.
          </Text>

          <Text style={styles.teamDescription}>
            For a direct conversation, you can also
            reach the AUMVEDA team through the
            contacts below.
          </Text>
        </View>

        {/* Sumannth */}

        <Pressable
          style={styles.personCard}
          onPress={() => openPhone("+919000006000")}
        >
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>
              S
            </Text>
          </View>

          <View style={styles.personInfo}>
            <Text style={styles.personLabel}>
              TEAM CONTACT
            </Text>

            <Text style={styles.personName}>
              Sumannth
            </Text>

            <Text style={styles.personPhone}>
              +91 90000 06000
            </Text>
          </View>

          <Ionicons
            name="call-outline"
            size={18}
            color="#607064"
          />
        </Pressable>

        {/* Srisha */}

        <Pressable
          style={styles.personCard}
          onPress={() => openPhone("+919704300006")}
        >
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>
              S
            </Text>
          </View>

          <View style={styles.personInfo}>
            <Text style={styles.personLabel}>
              TEAM CONTACT
            </Text>

            <Text style={styles.personName}>
              Srisha
            </Text>

            <Text style={styles.personPhone}>
              +91 97043 00006
            </Text>
          </View>

          <Ionicons
            name="call-outline"
            size={18}
            color="#607064"
          />
        </Pressable>

        {/* Srikanth */}

        <Pressable
          style={styles.personCard}
          onPress={() => openPhone("+918501042547")}
        >
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>
              S
            </Text>
          </View>

          <View style={styles.personInfo}>
            <Text style={styles.personLabel}>
              TEAM CONTACT
            </Text>

            <Text style={styles.personName}>
              Srikanth
            </Text>

            <Text style={styles.personPhone}>
              +91 85010 42547
            </Text>
          </View>

          <Ionicons
            name="call-outline"
            size={18}
            color="#607064"
          />
        </Pressable>
      </View>

      {/* =====================================================
          LOCATION
      ===================================================== */}

      <View style={styles.locationSection}>
        {/* Map visual */}

        <View style={styles.mapArt}>
          <View style={styles.mapGrid} />

          <View style={styles.mapRingA} />
          <View style={styles.mapRingB} />
          <View style={styles.mapRingC} />

          <View style={styles.mapPin}>
            <Ionicons
              name="location"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelTitle}>
              AUMVEDA
            </Text>

            <Text style={styles.mapLabelSubtitle}>
              Hyderabad
            </Text>
          </View>

          <Text style={styles.mapSmallLabel}>
            NORTH KAMALA NAGAR
          </Text>
        </View>

        {/* Location content */}

        <View style={styles.locationContent}>
          <Text style={styles.darkEyebrow}>
            OUR LOCATION
          </Text>

          <Text style={styles.locationTitle}>
            Rooted in
          </Text>

          <Text style={styles.locationTitleAccent}>
            Hyderabad.
          </Text>

          <Text style={styles.locationDescription}>
            AUMVEDA Wellness is based in Hyderabad,
            Telangana, and is building a connected
            natural wellness ecosystem from India.
          </Text>

          {/* Address */}

          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Ionicons
                name="location-outline"
                size={19}
                color="#315D48"
              />
            </View>

            <Text style={styles.addressText}>
              1-8-15/2FF8-1, GK Nilayam,
              {"\n"}
              North Kamala Nagar,
              {"\n"}
              Hyderabad – 500062
            </Text>
          </View>

          {/* Hours */}

          <View style={styles.hoursRow}>
            <View style={styles.addressIcon}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#315D48"
              />
            </View>

            <Text style={styles.hoursText}>
              Reach out by email or phone for
              enquiries and support.
            </Text>
          </View>

          {/* Explore */}

          <Pressable
            style={styles.locationButton}
            onPress={() => router.push("/products")}
          >
            <Text style={styles.locationButtonText}>
              Explore AUMVEDA
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <View style={styles.finalSection}>
        <View style={styles.finalOrbLeft} />
        <View style={styles.finalOrbRight} />

        <Text style={styles.finalEyebrow}>
          STAY CONNECTED
        </Text>

        <Text style={styles.finalTitle}>
          Let's build a more
        </Text>

        <Text style={styles.finalTitleAccent}>
          conscious future.
        </Text>

        <Text style={styles.finalDescription}>
          Discover authentic wellness, support
          conscious choices, and become part
          of the AUMVEDA journey.
        </Text>

        <View style={styles.finalActions}>
          <Pressable
            style={styles.finalPrimaryButton}
            onPress={openEmail}
          >
            <Text style={styles.finalPrimaryButtonText}>
              Talk to AUMVEDA
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable
            style={styles.finalSecondaryButton}
            onPress={() => router.push("/products")}
          >
            <Text style={styles.finalSecondaryButtonText}>
              Browse Products
            </Text>
          </Pressable>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingBottom: 0,
  },

  /* ========================================================
     HERO
  ======================================================== */

  hero: {
    minHeight: 760,
    backgroundColor: "#304838",
    overflow: "hidden",
    position: "relative",
  },

  heroGlowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(128,154,126,0.16)",
    top: -120,
    right: -100,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: "rgba(221,232,222,0.10)",
    bottom: 70,
    left: -120,
  },

  heroContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 55,
  },

  heroCopy: {
    width: "100%",
  },

  heroEyebrow: {
    color: "#DCE8DD",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginBottom: 16,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 47,
    fontWeight: "700",
    letterSpacing: -1,
  },

  heroTitleAccent: {
    color: "#D5E1D3",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 20,
  },

  heroDescription: {
    color: "#DCE5DC",
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 5,
  },

  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 20,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: "#F7F3E9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#284536",
    fontSize: 12,
    fontWeight: "800",
  },

  textButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },

  textButtonText: {
    color: "#DDE8DE",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ========================================================
     HERO VISUAL
  ======================================================== */

  heroVisual: {
    height: 315,
    marginTop: 38,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  orbitOne: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(221,232,222,0.11)",
  },

  orbitTwo: {
    position: "absolute",
    width: 225,
    height: 225,
    borderRadius: 113,
    borderWidth: 1,
    borderColor: "rgba(221,232,222,0.10)",
  },

  letterCard: {
    width: width - 70,
    height: 245,
    borderRadius: 23,
    backgroundColor: "rgba(220,226,216,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    padding: 18,
    transform: [
      {
        rotate: "-3deg",
      },
    ],
  },

  letterHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(230,237,228,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  logoMarkText: {
    color: "#E6EDE5",
    fontSize: 14,
    fontWeight: "700",
  },

  logoTextContainer: {
    flex: 1,
  },

  logoText: {
    color: "#E6EDE5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },

  logoSubText: {
    color: "#B9C9BA",
    fontSize: 6,
    letterSpacing: 1.8,
    marginTop: 2,
  },

  letterLines: {
    marginTop: 20,
  },

  letterLine: {
    height: 5,
    width: "70%",
    backgroundColor: "rgba(226,235,226,0.13)",
    borderRadius: 3,
    marginBottom: 7,
  },

  shortLetterLine: {
    width: "43%",
  },

  messageBox: {
    marginTop: 19,
    backgroundColor: "rgba(219,229,218,0.13)",
    borderRadius: 13,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  messageIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(222,233,222,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  messageContent: {
    flex: 1,
  },

  messageTitle: {
    color: "#E6EDE5",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  messageSubtitle: {
    color: "#BFCDBF",
    fontSize: 8,
    lineHeight: 13,
  },

  letterFooter: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  letterFooterText: {
    color: "#AABBAA",
    fontSize: 6.5,
    letterSpacing: 1,
  },

  heroChipTop: {
    position: "absolute",
    zIndex: 5,
    top: 0,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(242,245,236,0.96)",
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  heroChipIcon: {
    marginRight: 6,
  },

  heroChipText: {
    color: "#304838",
    fontSize: 9,
    fontWeight: "700",
  },

  heroChipBottom: {
    position: "absolute",
    zIndex: 5,
    bottom: 0,
    left: 3,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F3E9",
    borderRadius: 17,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 6,
  },

  heroChipBottomText: {
    color: "#304838",
    fontSize: 9,
    fontWeight: "700",
  },

  /* ========================================================
     REACH US
  ======================================================== */

  channelsSection: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#F7F3E9",
  },

  sectionHeader: {
    marginBottom: 27,
  },

  darkEyebrow: {
    color: "#66806C",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.1,
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#3B2A22",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "700",
  },

  sectionTitleAccent: {
    color: "#687B69",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
  },

  channelCard: {
    backgroundColor: "#FCFAF5",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E8E4D9",
    padding: 19,
    marginBottom: 13,
    minHeight: 170,
    position: "relative",
  },

  channelIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8EEE4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  channelLabel: {
    color: "#899187",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 6,
  },

  channelTitle: {
    color: "#304838",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 7,
  },

  channelDescription: {
    color: "#7A8179",
    fontSize: 11,
    lineHeight: 17,
    paddingRight: 25,
  },

  channelArrow: {
    position: "absolute",
    right: 17,
    bottom: 17,
  },

  /* ========================================================
     FORM
  ======================================================== */

  formSection: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#ECEAE0",
  },

  formImageContainer: {
    height: 355,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    marginBottom: 35,
  },

  formImage: {
    width: "100%",
    height: "100%",
  },

  formImageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(28,66,54,0.30)",
  },

  quoteContainer: {
    position: "absolute",
    left: 22,
    bottom: 27,
    right: 22,
  },

  quoteMark: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 35,
    fontFamily: "serif",
  },

  quoteText: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 27,
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 10,
  },

  quoteBrand: {
    color: "#E3EBE2",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 2,
  },

  supportCard: {
    position: "absolute",
    right: 12,
    top: 13,
    backgroundColor: "rgba(248,247,239,0.96)",
    borderRadius: 15,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 180,
  },

  supportIcon: {
    marginRight: 7,
  },

  supportTextContainer: {
    flex: 1,
  },

  supportTitle: {
    color: "#304838",
    fontSize: 9,
    fontWeight: "800",
  },

  supportSubtitle: {
    color: "#7B847D",
    fontSize: 7,
    marginTop: 2,
  },

  formContainer: {
    width: "100%",
  },

  formTitle: {
    color: "#3B2A22",
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "700",
  },

  formTitleAccent: {
    color: "#687B69",
    fontSize: 30,
    lineHeight: 36,
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 14,
  },

  formIntro: {
    color: "#737970",
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 23,
  },

  inputGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    color: "#68736A",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#F8F6EF",
    borderWidth: 1,
    borderColor: "#E0DDD2",
    borderRadius: 12,
    minHeight: 47,
    paddingHorizontal: 13,
    color: "#35483B",
    fontSize: 13,
  },

  messageInput: {
    height: 130,
    paddingTop: 13,
    paddingBottom: 13,
  },

  submitButton: {
    height: 49,
    backgroundColor: "#315D48",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 3,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  successMessage: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  successText: {
    color: "#315D48",
    fontSize: 11,
    fontWeight: "600",
  },

  /* ========================================================
     TEAM
  ======================================================== */

  teamSection: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#F7F3E9",
  },

  teamHeader: {
    marginBottom: 27,
  },

  teamTitle: {
    color: "#3B2A22",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "700",
  },

  teamTitleAccent: {
    color: "#687B69",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 13,
  },

  teamDescription: {
    color: "#737970",
    fontSize: 12,
    lineHeight: 20,
  },

  personCard: {
    minHeight: 76,
    backgroundColor: "#FCFAF5",
    borderWidth: 1,
    borderColor: "#E5E1D6",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  personAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#627765",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  personAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  personInfo: {
    flex: 1,
  },

  personLabel: {
    color: "#8A938A",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  personName: {
    color: "#304838",
    fontSize: 13,
    fontWeight: "700",
  },

  personPhone: {
    color: "#7B837C",
    fontSize: 10,
    marginTop: 2,
  },

  /* ========================================================
     LOCATION
  ======================================================== */

  locationSection: {
    backgroundColor: "#F0EEE5",
  },

  mapArt: {
    height: 330,
    backgroundColor: "#1E4032",
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  mapGrid: {
    position: "absolute",
    width: "150%",
    height: "150%",
    opacity: 0.25,
    borderWidth: 1,
    borderColor: "#8EA393",
  },

  mapRingA: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: "rgba(213,228,215,0.13)",
  },

  mapRingB: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(213,228,215,0.14)",
  },

  mapRingC: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(213,228,215,0.16)",
  },

  mapPin: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#607B68",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  mapLabel: {
    position: "absolute",
    top: 77,
    alignItems: "center",
  },

  mapLabelTitle: {
    color: "#E6EEE6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },

  mapLabelSubtitle: {
    color: "#B9C9BA",
    fontSize: 9,
    marginTop: 3,
  },

  mapSmallLabel: {
    position: "absolute",
    bottom: 25,
    color: "#AEBEAF",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  locationContent: {
    paddingHorizontal: 22,
    paddingVertical: 55,
  },

  locationTitle: {
    color: "#3B2A22",
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "700",
  },

  locationTitleAccent: {
    color: "#687B69",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 15,
  },

  locationDescription: {
    color: "#727970",
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 23,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 17,
  },

  addressIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#E2EADF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  addressText: {
    flex: 1,
    color: "#526058",
    fontSize: 12,
    lineHeight: 20,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },

  hoursText: {
    flex: 1,
    color: "#6F776F",
    fontSize: 11,
    lineHeight: 18,
    paddingTop: 2,
  },

  locationButton: {
    minHeight: 48,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: "#315D48",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  /* ========================================================
     FINAL CTA
  ======================================================== */

  finalSection: {
    minHeight: 430,
    backgroundColor: "#3D2114",
    paddingHorizontal: 22,
    paddingVertical: 70,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  finalOrbLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "rgba(230,218,198,0.08)",
    left: -155,
    top: -90,
  },

  finalOrbRight: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: "rgba(230,218,198,0.08)",
    right: -130,
    bottom: -80,
  },

  finalEyebrow: {
    color: "#D8CFC2",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginBottom: 15,
  },

  finalTitle: {
    color: "#FFFFFF",
    fontSize: 33,
    lineHeight: 39,
    fontWeight: "700",
    textAlign: "center",
  },

  finalTitleAccent: {
    color: "#D7CDBD",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    textAlign: "center",
    marginBottom: 16,
  },

  finalDescription: {
    color: "#D6CFC6",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 24,
  },

  finalActions: {
    alignItems: "center",
  },

  finalPrimaryButton: {
    minHeight: 49,
    paddingHorizontal: 19,
    borderRadius: 15,
    backgroundColor: "#F7F3E9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  finalPrimaryButtonText: {
    color: "#3D2114",
    fontSize: 12,
    fontWeight: "800",
  },

  finalSecondaryButton: {
    paddingVertical: 14,
  },

  finalSecondaryButtonText: {
    color: "#D8CFC2",
    fontSize: 11,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});