import React, { useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

/* ============================================================
   WEBSITE IMAGES
============================================================ */

const ABOUT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1600&q=85";

const ABOUT_STORY_IMAGE =
  "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=1200&q=85";

const ABOUT_WELLNESS_IMAGE =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85";

const ABOUT_HERBS_IMAGE =
  "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=1200&q=85";

/* ============================================================
   MAIN ABOUT PAGE
============================================================ */

export default function About() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const compactHeroActions = width < 460;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "bottom"]}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* =====================================================
          HERO
      ===================================================== */}

      <View style={styles.hero}>
        <Image
          source={{ uri: ABOUT_HERO_IMAGE }}
          style={styles.heroBackground}
          resizeMode="cover"
        />

        <View style={styles.heroOverlay} />

        {/* Decorative circles */}
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />

        <View style={styles.heroContent}>
          <Text style={styles.lightEyebrow}>
            OUR STORY
          </Text>

          <Text style={styles.heroTitle}>
            Rooted in nature.
          </Text>

          <Text style={styles.heroTitleAccent}>
            Guided by Ayurveda.
          </Text>

          <Text style={styles.heroDescription}>
            AUMVEDA Wellness brings authentic Ayurvedic
            and natural products closer to everyday life —
            thoughtfully sourced, transparently presented,
            and designed for conscious living.
          </Text>

          {/* HERO ACTIONS */}
          <View style={styles.heroActions}>
            <Pressable
              style={[
                styles.primaryButton,
                compactHeroActions && styles.primaryButtonCompact,
              ]}
              onPress={() => {
                router.push("/products");
              }}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  compactHeroActions && styles.primaryButtonTextCompact,
                ]}
              >
                Explore Wellness
              </Text>

              <Ionicons
                name="arrow-forward"
                size={22}
                color="#174936"
              />
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                compactHeroActions && styles.secondaryButtonCompact,
              ]}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  y: 650,
                  animated: true,
                });
              }}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  compactHeroActions && styles.secondaryButtonTextCompact,
                ]}
              >
                Discover Our Story
              </Text>

              <Ionicons
                name="arrow-down"
                size={18}
                color="#F5F1E8"
              />
            </Pressable>
          </View>

          {/* Hero visual */}
          <View style={styles.heroVisual}>
            {/* Top floating card */}
            <View style={styles.heroFloatingTop}>
              <View style={styles.floatingIcon}>
                <Ionicons
                  name="leaf-outline"
                  size={17}
                  color="#174F3A"
                />
              </View>

              <View style={styles.floatingTextContainer}>
                <Text style={styles.floatingTitle}>
                  Nature First
                </Text>

                <Text style={styles.floatingSubtitle}>
                  Conscious choices
                </Text>
              </View>
            </View>

            {/* Main image */}
            <View style={styles.heroImageFrame}>
              <Image
                source={{ uri: ABOUT_HERO_IMAGE }}
                style={styles.heroInnerImage}
                resizeMode="cover"
              />

              <View style={styles.heroImageOverlay} />

              <View style={styles.heroImageLabel}>
                <Text style={styles.heroImageLabelTitle}>
                  AUMVEDA
                </Text>

                <Text style={styles.heroImageLabelSubtitle}>
                  Rooted in tradition
                </Text>
              </View>
            </View>

            {/* Bottom floating card */}
            <View style={styles.heroFloatingBottom}>
              <View style={styles.floatingIcon}>
                <Ionicons
                  name="leaf"
                  size={17}
                  color="#174F3A"
                />
              </View>

              <View style={styles.floatingTextContainer}>
                <Text style={styles.floatingTitle}>
                  Ayurvedic Wisdom
                </Text>

                <Text style={styles.floatingSubtitle}>
                  Traditional knowledge
                </Text>
              </View>
            </View>
          </View>

        </View>
      </View>

      {/* =====================================================
          WHY AUMVEDA
      ===================================================== */}

      <View style={styles.section}>
        <Text style={styles.eyebrow}>
          WHY AUMVEDA
        </Text>

        <Text style={styles.sectionTitle}>
          Making natural wellness
          <Text style={styles.sectionTitleAccent}>
            {" "}easier to trust.
          </Text>
        </Text>

        <Text style={styles.sectionDescription}>
          AUMVEDA was created with a simple belief:
          natural wellness should feel clear, honest
          and accessible.
        </Text>

        {/* Story image */}
        <View style={styles.storyImageWrapper}>
          <Image
            source={{ uri: ABOUT_STORY_IMAGE }}
            style={styles.storyImage}
            resizeMode="cover"
          />

          <View style={styles.storyImageOverlay} />

          <View style={styles.storyBadge}>
            <Ionicons
              name="leaf-outline"
              size={17}
              color="#174F3A"
            />

            <Text style={styles.storyBadgeText}>
              Nature Led
            </Text>
          </View>
        </View>

        {/* Story content */}
        <View style={styles.storyContent}>
          <Text style={styles.smallLabel}>
            OUR BEGINNING
          </Text>

          <Text style={styles.storyTitle}>
            Tradition deserves a place
            {"\n"}
            in modern life.
          </Text>

          <Text style={styles.bodyText}>
            AUMVEDA Wellness was founded to make
            authentic, natural wellness more accessible
            in today's world.
          </Text>

          <Text style={styles.bodyText}>
            In a space filled with uncertainty,
            AUMVEDA brings clarity through carefully
            selected Ayurvedic, organic and natural
            products.
          </Text>

          <Text style={styles.bodyText}>
            By working closely with traditional
            producers, farmers and artisans, the
            platform aims to preserve valuable
            knowledge while making it easier for
            modern consumers to discover.
          </Text>

          {/* Story points */}
          <StoryPoint
            title="Authentic sourcing"
            description="Direct relationships with trusted producers."
          />

          <StoryPoint
            title="Conscious living"
            description="Products selected for mindful lifestyles."
          />

          <StoryPoint
            title="Transparent choices"
            description="Clear information for better decisions."
          />
        </View>
      </View>

      {/* =====================================================
          OUR PRINCIPLES
      ===================================================== */}

      <View style={styles.principlesSection}>
        <View style={styles.centerHeading}>
          <Text style={styles.eyebrow}>
            OUR PRINCIPLES
          </Text>

          <Text style={styles.centerTitle}>
            Three ideas behind
            <Text style={styles.sectionTitleAccent}>
              {" "}every choice.
            </Text>
          </Text>
        </View>

        <PrincipleCard
          number="01"
          icon="leaf-outline"
          title="Authentic Sourcing"
          text="We build relationships with trusted producers and value the knowledge behind every product."
        />

        <PrincipleCard
          number="02"
          icon="shield-checkmark-outline"
          title="Transparency & Trust"
          text="We believe customers deserve clear information and confidence in what they choose."
        />

        <PrincipleCard
          number="03"
          icon="heart-outline"
          title="Empowering Producers"
          text="We aim to create meaningful opportunities for farmers, artisans and traditional producers."
        />
      </View>

      {/* =====================================================
          OUR PURPOSE
      ===================================================== */}

      <View style={styles.section}>
        <View style={styles.purposeImageWrapper}>
          <Image
            source={{ uri: ABOUT_WELLNESS_IMAGE }}
            style={styles.purposeImage}
            resizeMode="cover"
          />

          <View style={styles.purposeImageOverlay} />

          <View style={styles.purposeFloatingCard}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color="#174F3A"
            />

            <Text style={styles.purposeFloatingText}>
              Built on trust, transparency & tradition
            </Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>
          OUR PURPOSE
        </Text>

        <Text style={styles.sectionTitle}>
          Wellness that
          <Text style={styles.sectionTitleAccent}>
            {" "}reaches beyond products.
          </Text>
        </Text>

        {/* Mission */}
        <PurposeBlock
          icon="leaf-outline"
          label="OUR MISSION"
          title="Make authentic natural wellness accessible."
          text="AUMVEDA aims to simplify conscious living through carefully curated organic, herbal and eco-friendly products delivered through a seamless digital experience."
        />

        {/* Vision */}
        <PurposeBlock
          icon="globe-outline"
          label="OUR VISION"
          title="Build a global ecosystem for natural living."
          text="The long-term vision is a world where sustainable choices become effortless and traditional producers gain meaningful digital access and fair opportunities."
        />
      </View>

      {/* =====================================================
          OUR IMPACT
      ===================================================== */}

      <View style={styles.impactSection}>
        <Text style={styles.lightEyebrow}>
          OUR IMPACT
        </Text>

        <Text style={styles.impactTitle}>
          Creating impact
          {"\n"}
          <Text style={styles.impactTitleAccent}>
            beyond products.
          </Text>
        </Text>

        <Text style={styles.impactIntro}>
          Every wellness choice can contribute to
          something larger — communities, sustainable
          practices and a more conscious way of living.
        </Text>

        <ImpactCard
          icon="people-outline"
          title="Rural Communities"
          text="Supporting small producers and local livelihoods."
        />

        <ImpactCard
          icon="leaf-outline"
          title="Sustainable Production"
          text="Encouraging responsible and ethical production."
        />

        <ImpactCard
          icon="sparkles-outline"
          title="Natural Awareness"
          text="Making conscious living easier to understand."
        />

        <ImpactCard
          icon="globe-outline"
          title="Connected Ecosystem"
          text="Bringing consumers and producers closer together."
        />
      </View>

      {/* =====================================================
          LOOKING AHEAD
      ===================================================== */}

      <View style={styles.futureSection}>
        <View style={styles.centerHeading}>
          <Text style={styles.eyebrow}>
            LOOKING AHEAD
          </Text>

          <Text style={styles.centerTitle}>
            Growing a more conscious
            <Text style={styles.sectionTitleAccent}>
              {" "}wellness ecosystem.
            </Text>
          </Text>

          <Text style={styles.centerDescription}>
            AUMVEDA's journey continues beyond today's
            marketplace.
          </Text>
        </View>

        <FutureCard
          number="01"
          title="Expanding Horizons"
          text="Bringing more natural products and trusted partners into the ecosystem."
        />

        <FutureCard
          number="02"
          title="Personalized Wellness"
          text="Moving towards wellness recommendations designed around individual lifestyles."
        />

        <FutureCard
          number="03"
          title="Global Vision"
          text="Taking authentic Indian Ayurveda and natural wellness to audiences around the world."
        />

        <FutureCard
          number="04"
          title="Conscious Ecosystem"
          text="Building a connected platform that supports mindful and sustainable living."
        />
      </View>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <View style={styles.finalSection}>
        {/* Decorative circles */}
        <View style={styles.finalCircleOne} />
        <View style={styles.finalCircleTwo} />

        <Ionicons
          name="leaf-outline"
          size={42}
          color="#C5CDBA"
          style={styles.finalLeafOne}
        />

        <Ionicons
          name="leaf"
          size={32}
          color="#C5CDBA"
          style={styles.finalLeafTwo}
        />

        <Text style={styles.eyebrow}>
          THE AUMVEDA JOURNEY
        </Text>

        <Text style={styles.finalTitle}>
          Reconnect with
        </Text>

        <Text style={styles.finalTitleAccent}>
          nature's wisdom.
        </Text>

        <Text style={styles.finalDescription}>
          Discover a more thoughtful way to bring
          Ayurveda and natural living into everyday life.
        </Text>

        <Pressable
          style={styles.finalButton}
          onPress={() => router.push("/products")}
        >
          <Text style={styles.finalButtonText}>
            Explore AUMVEDA
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   STORY POINT
============================================================ */

function StoryPoint({
  title,
  description,
}) {
  return (
    <View style={styles.storyPoint}>
      <View style={styles.checkCircle}>
        <Ionicons
          name="checkmark"
          size={14}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.storyPointContent}>
        <Text style={styles.storyPointTitle}>
          {title}
        </Text>

        <Text style={styles.storyPointDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   PRINCIPLE CARD
============================================================ */

function PrincipleCard({
  number,
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.principleCard}>
      <Text style={styles.cardNumber}>
        {number}
      </Text>

      <View style={styles.principleIcon}>
        <Ionicons
          name={icon}
          size={24}
          color="#174F3A"
        />
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardText}>
        {text}
      </Text>
    </View>
  );
}

/* ============================================================
   PURPOSE BLOCK
============================================================ */

function PurposeBlock({
  icon,
  label,
  title,
  text,
}) {
  return (
    <View style={styles.purposeBlock}>
      <View style={styles.purposeIcon}>
        <Ionicons
          name={icon}
          size={22}
          color="#174F3A"
        />
      </View>

      <View style={styles.purposeContent}>
        <Text style={styles.purposeLabel}>
          {label}
        </Text>

        <Text style={styles.purposeTitle}>
          {title}
        </Text>

        <Text style={styles.bodyText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   IMPACT CARD
============================================================ */

function ImpactCard({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.impactCard}>
      <View style={styles.impactIcon}>
        <Ionicons
          name={icon}
          size={23}
          color="#DCEDE2"
        />
      </View>

      <Text style={styles.impactCardTitle}>
        {title}
      </Text>

      <Text style={styles.impactCardText}>
        {text}
      </Text>
    </View>
  );
}

/* ============================================================
   FUTURE CARD
============================================================ */

function FutureCard({
  number,
  title,
  text,
}) {
  return (
    <View style={styles.futureCard}>
      <Text style={styles.futureNumber}>
        {number}
      </Text>

      <Text style={styles.futureTitle}>
        {title}
      </Text>

      <Text style={styles.futureText}>
        {text}
      </Text>
    </View>
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
    minHeight: 780,
    backgroundColor: "#173F30",
    position: "relative",
    overflow: "hidden",
  },

  heroBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.46,
  },

  heroOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(16, 55, 42, 0.78)",
  },

  heroOrbLarge: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: "rgba(220,237,226,0.12)",
    right: -100,
    top: 70,
  },

  heroOrbSmall: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(220,237,226,0.10)",
    right: -40,
    top: 130,
  },

  heroContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 55,
  },

  lightEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.3,
    color: "#DCEDE2",
    marginBottom: 15,
  },

  heroTitle: {
    fontSize: 43,
    lineHeight: 47,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1.2,
  },

  heroTitleAccent: {
    fontSize: 35,
    lineHeight: 43,   
    color: "#DCEED8",
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    marginBottom: 21,
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: "#E8F0EA",
    marginBottom: 23,
    maxWidth: width - 44,
  },

  heroActions: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  primaryButton: {
    minHeight: 58,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#F5F1E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  primaryButtonCompact: {
    minHeight: 50,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 6,
  },

  primaryButtonText: {
    color: "#174936",
    fontSize: 15,
    fontWeight: "700",
  },

  primaryButtonTextCompact: {
    fontSize: 12,
  },

  secondaryButton: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F5F1E8",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryButtonCompact: {
    minHeight: 44,
    paddingHorizontal: 7,
    borderRadius: 12,
    gap: 5,
  },

  secondaryButtonText: {
    color: "#F5F1E8",
    fontSize: 13,
    fontWeight: "600",
  },

  secondaryButtonTextCompact: {
    fontSize: 10,
  },

  /* Hero visual */

  heroVisual: {
    marginTop: 42,
    width: "100%",
    height: 310,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  heroImageFrame: {
    width: width - 92,
    height: 275,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#244E3D",
  },

  heroInnerImage: {
    width: "100%",
    height: "100%",
  },

  heroImageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(15,58,43,0.32)",
  },

  heroImageLabel: {
    position: "absolute",
    left: 18,
    bottom: 18,
  },

  heroImageLabelTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },

  heroImageLabelSubtitle: {
    color: "#DCEDE2",
    fontSize: 10,
    marginTop: 3,
  },

  heroFloatingTop: {
    position: "absolute",
    zIndex: 5,
    top: 0,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(246,245,236,0.95)",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 11,
    maxWidth: 180,
  },

  heroFloatingBottom: {
    position: "absolute",
    zIndex: 5,
    bottom: 0,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(246,245,236,0.95)",
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 11,
    maxWidth: 195,
  },

  floatingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E4EEE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  floatingTextContainer: {
    flex: 1,
  },

  floatingTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#193A2E",
  },

  floatingSubtitle: {
    fontSize: 8,
    color: "#718078",
    marginTop: 2,
  },

  /* ========================================================
     GENERAL SECTION
  ======================================================== */

  section: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#F8F5ED",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    color: "#557761",
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    color: "#3A2921",
    letterSpacing: -0.7,
    marginBottom: 15,
  },

  sectionTitleAccent: {
    color: "#657965",
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
  },

  sectionDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: "#6D746C",
    marginBottom: 28,
  },

  centerHeading: {
    alignItems: "center",
    marginBottom: 30,
  },

  centerTitle: {
    textAlign: "center",
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "700",
    color: "#3A2921",
    letterSpacing: -0.6,
  },

  centerDescription: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: "#6D746C",
    marginTop: 13,
  },

  smallLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#66806C",
    marginBottom: 12,
  },

  bodyText: {
    fontSize: 14,
    lineHeight: 23,
    color: "#6A746D",
    marginBottom: 16,
  },

  /* ========================================================
     STORY
  ======================================================== */

  storyImageWrapper: {
    height: 330,
    borderRadius: 27,
    overflow: "hidden",
    position: "relative",
    marginBottom: 30,
  },

  storyImage: {
    width: "100%",
    height: "100%",
  },

  storyImageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(23,63,48,0.10)",
  },

  storyBadge: {
    position: "absolute",
    left: 15,
    bottom: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F5ED",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  storyBadgeText: {
    color: "#174F3A",
    fontSize: 11,
    fontWeight: "700",
  },

  storyContent: {
    marginTop: 2,
  },

  storyTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
    color: "#3A2921",
    marginBottom: 18,
  },

  storyPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 13,
  },

  checkCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#17563F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    marginTop: 1,
  },

  storyPointContent: {
    flex: 1,
  },

  storyPointTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#294536",
    marginBottom: 3,
  },

  storyPointDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#7A817A",
  },

  /* ========================================================
     PRINCIPLES
  ======================================================== */

  principlesSection: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#EEECE2",
  },

  principleCard: {
    backgroundColor: "#FAF9F4",
    borderRadius: 23,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E3E1D7",
  },

  cardNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A2ABA2",
    letterSpacing: 1,
    marginBottom: 15,
  },

  principleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3EDE1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#294536",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 13,
    lineHeight: 22,
    color: "#707970",
  },

  /* ========================================================
     PURPOSE
  ======================================================== */

  purposeImageWrapper: {
    height: 310,
    borderRadius: 27,
    overflow: "hidden",
    position: "relative",
    marginBottom: 33,
  },

  purposeImage: {
    width: "100%",
    height: "100%",
  },

  purposeImageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(35,52,42,0.10)",
  },

  purposeFloatingCard: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 15,
    backgroundColor: "rgba(250,249,244,0.96)",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  purposeFloatingText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#294536",
  },

  purposeBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    paddingTop: 21,
    borderTopWidth: 1,
    borderTopColor: "#DDDCD3",
  },

  purposeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E4EEE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  purposeContent: {
    flex: 1,
  },

  purposeLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.7,
    color: "#66806C",
    marginBottom: 7,
  },

  purposeTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#294536",
    marginBottom: 8,
  },

  /* ========================================================
     IMPACT
  ======================================================== */

  impactSection: {
    paddingHorizontal: 22,
    paddingVertical: 60,
    backgroundColor: "#531712",
  },

  impactTitle: {
    fontSize: 33,
    lineHeight: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },

  impactTitleAccent: {
    color: "#BFD5C1",
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
  },

  impactIntro: {
    fontSize: 13,
    lineHeight: 22,
    color: "#C8D9CF",
    marginBottom: 20,
  },

  impactCard: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingVertical: 21,
  },

  impactIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  impactCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  impactCardText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#C6D6CC",
  },

  /* ========================================================
     FUTURE
  ======================================================== */

  futureSection: {
    paddingHorizontal: 22,
    paddingVertical: 58,
    backgroundColor: "#F8F5ED",
  },

  futureCard: {
    backgroundColor: "#FAF9F4",
    borderRadius: 21,
    padding: 21,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E2E0D6",
  },

  futureNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9BA69C",
    letterSpacing: 1,
    marginBottom: 13,
  },

  futureTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#294536",
    marginBottom: 7,
  },

  futureText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#707970",
  },

  /* ========================================================
     FINAL CTA
  ======================================================== */

  finalSection: {
    minHeight: 450,
    paddingHorizontal: 22,
    paddingVertical: 72,
    backgroundColor: "#E6EADF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  finalCircleOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(77,104,83,0.10)",
    top: -120,
    left: -80,
  },

  finalCircleTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(77,104,83,0.08)",
    bottom: -70,
    right: -50,
  },

  finalLeafOne: {
    position: "absolute",
    top: 42,
    right: 35,
    opacity: 0.65,
  },

  finalLeafTwo: {
    position: "absolute",
    bottom: 48,
    left: 35,
    opacity: 0.55,
  },

  finalTitle: {
    fontSize: 33,
    lineHeight: 39,
    fontWeight: "700",
    color: "#3A2921",
    textAlign: "center",
  },

  finalTitleAccent: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "500",
    fontStyle: "italic",
    fontFamily: "serif",
    color: "#657965",
    marginBottom: 17,
    textAlign: "center",
  },

  finalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#68736B",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 25,
  },

  finalButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#174F3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  finalButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});