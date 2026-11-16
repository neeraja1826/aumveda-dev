import AsyncStorage from '@react-native-async-storage/async-storage';

export const APPLIED_COUPON_STORAGE_KEY = '@aumveda_applied_coupon';

export async function getStoredCoupon() {
  const stored = await AsyncStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function saveCouponCode(code) {
  await AsyncStorage.setItem(
    APPLIED_COUPON_STORAGE_KEY,
    JSON.stringify({
      code,
      applied: false,
    })
  );
}

export async function saveAppliedCoupon(coupon) {
  await AsyncStorage.setItem(
    APPLIED_COUPON_STORAGE_KEY,
    JSON.stringify(coupon)
  );
}

export async function clearStoredCoupon() {
  await AsyncStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
}
