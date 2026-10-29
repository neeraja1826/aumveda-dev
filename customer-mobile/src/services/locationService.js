
import * as Location from "expo-location";

export async function getCurrentLocation() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission was denied.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const addresses = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    address: addresses.length
      ? [
          addresses[0].name,
          addresses[0].street,
          addresses[0].district,
          addresses[0].city,
          addresses[0].region,
        ]
          .filter(Boolean)
          .join(", ")
      : "Address unavailable",
  };
}
