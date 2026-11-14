
import * as Location from "expo-location";

export function formatLocationPlace(place) {
  const addressLine1 = [
    place?.streetNumber,
    place?.street,
  ]
    .filter(Boolean)
    .join(" ");
  const city =
    place?.city ||
    place?.municipality ||
    place?.subregion ||
    place?.district ||
    "";
  const district =
    place?.district && place.district !== city
      ? place.district
      : place?.subregion !== city
        ? place?.subregion
        : "";
  const addressLine2 = [
    place?.name && place.name !== addressLine1
      ? place.name
      : "",
    district,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
  const state = place?.region || "";
  const postalCode = place?.postalCode || "";
  const country = place?.country || "";
  const streetAddress =
    addressLine1 ||
    place?.name ||
    place?.street ||
    "";
  const address = [
    streetAddress,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    address,
    addressLine1: streetAddress,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  };
}

export async function getCurrentLocation() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission was denied.");
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error(
      "Location services are turned off. Enable them and try again."
    );
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const places = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  const details = formatLocationPlace(places?.[0]);

  if (!details.address) {
    throw new Error(
      "Your location was detected, but no address details were available."
    );
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    ...details,
  };
}
