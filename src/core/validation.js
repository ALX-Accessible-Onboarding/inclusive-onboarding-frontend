import { isAmharic } from '../labels.js';
// Client-side validation returning plain, human-friendly error messages

export function validateName(value, lang = 'en') {
  const isAm = isAmharic(lang);
  if (!value || !String(value).trim()) {
    return isAm ? 'እባክዎ ስምዎን ያስገቡ።' : 'Please tell us what to call you.';
  }
  if (String(value).trim().length < 2) {
    return isAm ? 'ስም ቢያንስ 2 ፊደላት መሆን አለበት።' : 'Name must be at least 2 characters.';
  }
  return null;
}

export function validateContact(type, value, lang = 'en') {
  const isAm = isAmharic(lang);

  if (!value || !String(value).trim()) {
    if (type === 'email') {
      return isAm ? 'እባክዎ ኢሜይል ያስገቡ።' : 'Please add your email address.';
    }
    if (type === 'phone') {
      return isAm ? 'እባክዎ ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ።' : 'Please add your 10-digit phone number.';
    }
    return isAm ? 'እባክዎ ስልክ ወይም ኢሜይል ያስገቡ።' : 'Please add your phone number or email.';
  }

  const clean = String(value).trim();
  const effectiveType = (type === 'auto' || !type)
    ? (clean.includes('@') || /[a-zA-Z]/.test(clean) ? 'email' : 'phone')
    : type;

  if (effectiveType === 'email') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return isAm ? 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ።' : 'Please enter a valid email address.';
    }
    return null;
  }

  // Disallow letters in phone
  if (/[a-zA-Z]/.test(clean)) {
    return isAm ? 'ስልክ ቁጥር ፊደል መያዝ አይችልም።' : 'Phone number cannot contain letters.';
  }

  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length !== 10 || (!digits.startsWith('09') && !digits.startsWith('07'))) {
    return isAm
      ? 'ስልክ ቁጥር በ 09 ወይም 07 የሚጀምር ባለ 10 አሃዝ መሆን አለበት።'
      : 'Phone number must be 10 digits starting with 09 or 07.';
  }

  return null;
}

export function validateIdNumber(route, value, lang = 'en') {
  const isAm = isAmharic(lang);

  if (route === 'referral') return null;
  if (!value || !String(value).trim()) return null;

  const clean = String(value).trim();
  const effectiveRoute = route || 'kebele';

  if (effectiveRoute === 'kebele') {
    const kebeleRegex = /^(?:[A-Za-z]{2,4}[\/\-]\d{3,8}|\d{3,8}[\/\-][A-Za-z]{2,4}|[A-Za-z0-9]{3,8}[\/\-][A-Za-z0-9]{2,6})$/;
    if (!kebeleRegex.test(clean)) {
      return isAm ? 'ትክክለኛ የቀበሌ መታወቂያ ያስገቡ (ምሳሌ፡ 12345/AA)።' : 'Please enter a valid Kebele ID (e.g. 12345/AA).';
    }
    return null;
  }

  if (effectiveRoute === 'passport') {
    const passportRegex = /^[A-Za-z]{1,2}\d{6,9}$/;
    if (!passportRegex.test(clean)) {
      return isAm ? 'ትክክለኛ የፓስፖርት ቁጥር ያስገቡ (ምሳሌ፡ EP1234567)።' : 'Please enter a valid passport number (e.g. EP1234567).';
    }
    return null;
  }

  if (effectiveRoute === 'refugee') {
    if (clean.length < 5 || !/^[A-Za-z0-9\/\-]+$/.test(clean)) {
      return isAm ? 'ትክክለኛ የስደተኞች መታወቂያ ያስገቡ (ምሳሌ፡ ETH-12345)።' : 'Please enter a valid refugee ID (e.g. ETH-12345).';
    }
    return null;
  }

  if (clean.length < 4) {
    return isAm ? 'የሰነድ ቁጥር ቢያንስ 4 ፊደላት/ቁጥሮች መሆን አለበት።' : 'Document number must be at least 4 characters.';
  }

  return null;
}
